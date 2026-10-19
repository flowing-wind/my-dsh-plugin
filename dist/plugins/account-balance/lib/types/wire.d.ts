/** Provider balance fields shared by the Host and browser. */
import { z } from 'zod';
/** Validated balance response; credential fields are excluded. */
export declare const balanceSchema: z.ZodObject<{
    is_available: z.ZodBoolean;
    balance_infos: z.ZodArray<z.ZodObject<{
        currency: z.ZodString;
        total_balance: z.ZodString;
        granted_balance: z.ZodString;
        topped_up_balance: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
//# sourceMappingURL=wire.d.ts.map