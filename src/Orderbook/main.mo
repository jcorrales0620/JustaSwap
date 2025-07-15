import HashMap "mo:base/HashMap";
import Timer "mo:base/Timer";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
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

  // Custom hash function for Nat values to replace deprecated Hash.hash
  private func customHash(n: Nat) : Hash.Hash {
    // Hash.Hash is Nat32, so we need to convert Nat to Nat32
    // Use modulo to ensure it fits in 32 bits
    Nat32.fromNat(n % 0xFFFFFFFF)
  };

  // State utama: Menyimpan order yang belum diproses, dikelompokkan per batch
  private stable var pendingOrdersEntries : [(BatchId, [EncryptedOrder])] = [];
  private var pendingOrders = HashMap.HashMap<BatchId, [EncryptedOrder]>(0, Nat.equal, customHash);

  // Counter untuk membuat BatchId yang unik
  private stable var batchCounter : BatchId = 0;

  // Menyimpan apakah timer untuk batch saat ini sedang berjalan
  private var timerIsSet : Bool = false;

  // Definisikan interface untuk Execution canister
  type ExecutionCanister = actor {
    processOrderBatch : (BatchId, [EncryptedOrder]) -> async ();
  };

  // Store the Execution canister principal
  private stable var executionCanisterId : ?Principal = null;
  
  // Initialize function to set the Execution canister
  public shared(_msg) func initialize(executionPrincipal: Principal) : async Text {
    switch (executionCanisterId) {
      case (null) {
        executionCanisterId := ?executionPrincipal;
        "Orderbook initialized with Execution canister: " # Principal.toText(executionPrincipal)
      };
      case (?existing) {
        "Already initialized with Execution canister: " # Principal.toText(existing)
      };
    };
  };

  // Get the Execution canister ID (for debugging/verification)
  public query func getExecutionCanisterId() : async ?Principal {
    executionCanisterId
  };

  // Fungsi untuk submit order
  public shared(_msg) func submitOrder(order: EncryptedOrder) : async () {
    // Ensure Execution canister is initialized
    switch (executionCanisterId) {
      case (null) {
        Debug.print("ERROR: Orderbook not initialized. Call initialize() first.");
        assert(false);
      };
      case (?_) {
        // Continue with order submission
      };
    };

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
      let _timerId = Timer.setTimer<system>(#seconds 5, func() : async () {
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

      // Get the Execution canister
      switch (executionCanisterId) {
        case (null) {
          Debug.print("ERROR: Execution canister not set");
        };
        case (?execId) {
          let executionCanister : ExecutionCanister = actor(Principal.toText(execId));
          // Panggil ExecutionCanister untuk memproses batch!
          await executionCanister.processOrderBatch(batchId, ordersToProcess);
        };
      };
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
      customHash
    );
    pendingOrdersEntries := [];
  };
}
