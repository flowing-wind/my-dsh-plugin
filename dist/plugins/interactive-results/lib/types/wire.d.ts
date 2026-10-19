/** Declarative result format; no executable code or remote resources. */
import { z } from 'zod';
/** Agent-authored tables, bar charts, and explicitly submitted forms. */
export declare const resultSchema: z.ZodObject<{
    title: z.ZodString;
    blocks: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"table">;
        columns: z.ZodArray<z.ZodString>;
        rows: z.ZodArray<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"bar">;
        entries: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            value: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"form">;
        fields: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            label: z.ZodString;
            type: z.ZodEnum<{
                number: "number";
                text: "text";
                select: "select";
            }>;
            options: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
    }, z.core.$strip>], "type">>;
}, z.core.$strip>;
//# sourceMappingURL=wire.d.ts.map