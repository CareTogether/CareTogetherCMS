// Thanks to https://github.com/RicoSuter/NSwag/issues/3110
using NJsonSchema.Generation;

public class MarkAsRequiredIfNonNullableSchemaProcessor : ISchemaProcessor
{
    public void Process(SchemaProcessorContext context)
    {
        foreach (var (propName, prop) in context.Schema.ActualProperties)
        {
            if (!prop.IsNullable(NJsonSchema.SchemaType.OpenApi3))
            {
                prop.IsRequired = true;
            }
        }
    }
}