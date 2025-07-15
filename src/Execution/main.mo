import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";

actor Execution {
  // Store the authorized Orderbook canister principal
  // This should be set during deployment or initialization
  private stable var authorizedOrderbook : ?Principal = null;
  
  // Tipe yang sama persis dengan yang di Orderbook canister
  public type EncryptedOrder = {
    order_data : Blob;
    transport_public_key : Blob;
    owner : Principal;
  };

  // Initialize function to set the authorized Orderbook canister
  public shared(_msg) func initialize(orderbookPrincipal: Principal) : async Result.Result<Text, Text> {
    // Only allow initialization once
    switch (authorizedOrderbook) {
      case (null) {
        authorizedOrderbook := ?orderbookPrincipal;
        #ok("Execution canister initialized with authorized Orderbook: " # Principal.toText(orderbookPrincipal))
      };
      case (?existing) {
        #err("Already initialized with Orderbook: " # Principal.toText(existing))
      };
    };
  };

  // Get the authorized Orderbook principal (for debugging/verification)
  public query func getAuthorizedOrderbook() : async ?Principal {
    authorizedOrderbook
  };

  public shared(msg) func processOrderBatch(batchId: Nat, orders: [EncryptedOrder]) : async () {
    // Security check: Ensure caller is the authorized Orderbook canister
    switch (authorizedOrderbook) {
      case (null) {
        Debug.print("ERROR: Execution canister not initialized. Call initialize() first.");
        assert(false); // Reject the call
      };
      case (?authorized) {
        if (msg.caller != authorized) {
          Debug.print("ERROR: Unauthorized caller. Expected: " # Principal.toText(authorized) # ", Got: " # Principal.toText(msg.caller));
          assert(false); // Reject the call
        };
      };
    };

    Debug.print("Processing batch " # Nat.toText(batchId) # " with " # Nat.toText(orders.size()) # " orders.");

    // === SIMULASI VETKEYS ===
    // Di dunia nyata, di sini kita akan memanggil API sistem vetKD.
    // Untuk Phase 1, kita hanya akan mencetak pesan log.
    Debug.print("Simulating: Calling vetKeys system API to get decryption key for batch " # Nat.toText(batchId));
    let simulatedKey = "SIMULATED_DECRYPTION_KEY_" # Nat.toText(batchId);
    Debug.print("Simulating: Received key: " # simulatedKey);

    // === SIMULASI DEKRIPSI & MATCHING ===
    // Loop melalui semua order dan "dekripsi" mereka.
    for (order in orders.vals()) {
      Debug.print("Simulating: Decrypting order for principal " # Principal.toText(order.owner));
    };

    Debug.print("Simulating: Calculating uniform clearing price and settling trades.");
    Debug.print("--- Batch " # Nat.toText(batchId) # " processed successfully. ---");
  };
}
