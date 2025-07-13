import HashMap "mo:base/HashMap";
import Timer "mo:base/Timer";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Hash "mo:base/Hash";

actor Orderbook {
  // Tipe untuk ID unik setiap batch
  type BatchId = Nat;

  // Struktur untuk order terenkripsi yang kita terima
  public type EncryptedOrder = {
    order_data : Blob; // Data order yang sudah dienkripsi oleh klien
    transport_public_key : Blob; // Kunci publik klien untuk dekripsi nanti
    owner : Principal; // Principal dari si pemilik order
  };

  // State utama: Menyimpan order yang belum diproses, dikelompokkan per batch
  private stable var pendingOrdersEntries : [(BatchId, [EncryptedOrder])] = [];
  private var pendingOrders = HashMap.HashMap<BatchId, [EncryptedOrder]>(0, Nat.equal, Hash.hash);

  // Counter untuk membuat BatchId yang unik
  private stable var batchCounter : BatchId = 0;

  // Menyimpan apakah timer untuk batch saat ini sedang berjalan
  private var timerIsSet : Bool = false;

  // Definisikan interface untuk Execution canister
  type ExecutionCanister = actor {
    processOrderBatch : (BatchId, [EncryptedOrder]) -> async ();
  };

  // Hardcode ID canister Execution untuk interaksi
  let executionCanister : ExecutionCanister = actor("uxrrr-q7777-77774-qaaaq-cai");

  // Fungsi untuk submit order
  public shared(msg) func submitOrder(order: EncryptedOrder) : async () {
    let currentBatchId = batchCounter;

    // Tambahkan order ke batch yang sedang berjalan
    switch (pendingOrders.get(currentBatchId)) {
      case (null) {
        // Jika ini order pertama, buat batch baru
        pendingOrders.put(currentBatchId, [order]);
      };
      case (?existingOrders) {
        // Jika batch sudah ada, tambahkan order baru
        pendingOrders.put(currentBatchId, Array.append(existingOrders, [order]));
      };
    };

    // Jika timer belum disetel untuk batch ini, setel sekarang!
    if (not timerIsSet) {
      timerIsSet := true;
      // Setel timer on-chain untuk 5 detik
      let timerId = Timer.setTimer<system>(#seconds 5, func() : async () {
        await onTimerComplete(currentBatchId);
      });
    };
  };

  // Fungsi privat yang akan dieksekusi secara otonom saat timer selesai
  private func onTimerComplete(batchId: BatchId) : async () {
    // Ambil semua order untuk batch yang sudah selesai
    let ordersToProcess = switch (pendingOrders.get(batchId)) {
      case (null) { [] };
      case (?orders) { orders };
    };

    if (ordersToProcess.size() > 0) {
      // Hapus batch dari pendingOrders untuk mencegah re-processing
      pendingOrders.delete(batchId);

      // Panggil ExecutionCanister untuk memproses batch!
      await executionCanister.processOrderBatch(batchId, ordersToProcess);
    };

    // Siapkan untuk batch berikutnya
    batchCounter += 1;
    timerIsSet := false;
  };

  // System functions untuk upgrade
  system func preupgrade() {
    pendingOrdersEntries := pendingOrders.entries() |> Iter.toArray(_);
  };

  system func postupgrade() {
    pendingOrders := HashMap.fromIter<BatchId, [EncryptedOrder]>(
      pendingOrdersEntries.vals(),
      pendingOrdersEntries.size(),
      Nat.equal,
      Hash.hash
    );
    pendingOrdersEntries := [];
  };
}
