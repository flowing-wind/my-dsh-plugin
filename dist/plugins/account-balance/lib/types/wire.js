/** Provider balance fields shared by the Host and browser. */
import { z } from 'zod';
/** Validated balance response; credential fields are excluded. */
export const balanceSchema = z.object({
    is_available: z.boolean(),
    balance_infos: z.array(z.object({
        currency: z.string(), total_balance: z.string(), granted_balance: z.string(), topped_up_balance: z.string(),
    })),
});
//# sourceMappingURL=wire.js.map