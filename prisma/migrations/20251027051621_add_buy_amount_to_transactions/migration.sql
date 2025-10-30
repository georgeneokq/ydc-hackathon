/*
  Warnings:

  - You are about to drop the column `sell_token_amount` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `buy_amount` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sell_amount` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "sell_token_amount",
ADD COLUMN     "buy_amount" TEXT NOT NULL,
ADD COLUMN     "sell_amount" TEXT NOT NULL;
