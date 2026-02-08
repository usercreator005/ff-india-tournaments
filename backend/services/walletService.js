const AdminWallet = require("../models/AdminWallet");
const WalletTransaction = require("../models/WalletTransaction");

/* =========================================
   ENSURE WALLET EXISTS
========================================= */
const getOrCreateWallet = async (adminId) => {
  let wallet = await AdminWallet.findOne({ adminId });

  if (!wallet) {
    wallet = await AdminWallet.create({
      adminId,
      balance: 0
    });
  }

  return wallet;
};

/* =========================================
   CREDIT WALLET
   (Money added to admin wallet)
========================================= */
const creditWallet = async ({
  adminId,
  amount,
  type = "MANUAL_ADJUSTMENT",
  note = "",
  referenceId = null
}) => {
  if (amount <= 0) {
    throw new Error("Credit amount must be greater than 0");
  }

  const wallet = await getOrCreateWallet(adminId);

  wallet.balance += amount;
  await wallet.save();

  await WalletTransaction.create({
    adminId,
    type,
    amount,
    status: "completed",
    note,
    referenceId
  });

  return wallet.balance;
};

/* =========================================
   DEBIT WALLET
   (Money deducted from admin wallet)
========================================= */
const debitWallet = async ({
  adminId,
  amount,
  type = "WITHDRAW_APPROVED",
  note = "",
  referenceId = null
}) => {
  if (amount <= 0) {
    throw new Error("Debit amount must be greater than 0");
  }

  const wallet = await getOrCreateWallet(adminId);

  if (wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.balance -= amount;
  await wallet.save();

  await WalletTransaction.create({
    adminId,
    type,
    amount,
    status: "completed",
    note,
    referenceId
  });

  return wallet.balance;
};

/* =========================================
   HOLD / PENDING TRANSACTION (Optional use)
   Example: withdraw request before approval
========================================= */
const createPendingTransaction = async ({
  adminId,
  amount,
  type = "WITHDRAW_REQUEST",
  note = "",
  referenceId = null
}) => {
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  await WalletTransaction.create({
    adminId,
    type,
    amount,
    status: "pending",
    note,
    referenceId
  });
};

/* =========================================
   REJECT TRANSACTION
========================================= */
const rejectTransaction = async (transactionId, note = "Transaction rejected") => {
  const tx = await WalletTransaction.findById(transactionId);
  if (!tx) throw new Error("Transaction not found");

  tx.status = "rejected";
  tx.note = note;
  await tx.save();
};

module.exports = {
  getOrCreateWallet,
  creditWallet,
  debitWallet,
  createPendingTransaction,
  rejectTransaction
};
