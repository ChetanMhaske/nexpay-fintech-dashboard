import { z } from 'zod';

export const createTransactionSchema = z.object({
  type: z.enum(['transfer', 'deposit', 'withdraw', 'crypto_buy', 'crypto_sell']),
  amount: z.number().positive('Amount must be positive').min(0.00000001, 'Minimum amount is 0.00000001'),
  currency: z.enum(['USD', 'BTC', 'ETH']),
  description: z.string().optional(),
  recipientEmail: z.string().email('Invalid recipient email').optional()
}).refine(data => {
  if (data.type === 'transfer' && !data.recipientEmail) {
    return false;
  }
  return true;
}, {
  message: "Recipient email is required for transfers",
  path: ["recipientEmail"]
});
