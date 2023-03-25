import { z, ZodArray, ZodNull, ZodObject, ZodOptional, ZodString } from "zod";
type ArgvSchemaOptions = ZodObject<{
  [key: string]:
    | ZodString
    | ZodArray<ZodString>
    | ZodNull
    | ZodOptional<ZodString>
    | ZodOptional<ZodArray<ZodString>>
    | ZodOptional<ZodNull>;
}>;
type ArgvSchemaActions = {
  [key: string]: ArgvSchemaOptions | ZodNull;
};

export const createArgv = <TSchema extends ArgvSchemaActions>(
  schema: TSchema
) => {
  return {
    validate: (argv: string[]) => validateArgv(argv, schema),
  };
};

type ValidateReturn<TSchema extends ArgvSchemaActions> = {
  [P in keyof TSchema]: ReturnType<TSchema[P]["parse"]>;
};

const validateArgv = <TSchema extends ArgvSchemaActions>(
  argv: string[],
  validator: TSchema
) => {
  const args = argv
    .map((s) => s.trim())
    .reduce(
      (args, arg) => {
        if (!args.action) {
          if (arg.startsWith("--"))
            throw new Error(
              `You must run one of actions in first: ${Object.keys(
                validator
              ).join(", ")} `
            );
          if (!Object.keys(validator).includes(arg)) return args;
          args.action = arg;
          args.args[arg] = null;
        } else if (args.action && arg.startsWith("--")) {
          args.opt = arg.replace("--", "");
          args.args[args.action] = {};
          args.args[args.action]![args.opt] = null;
        } else if (args.action && args.opt) {
          if (args.args[args.action]![args.opt] !== null) {
            if (Array.isArray(args.args[args.action]![args.opt])) {
              args.args[args.action]![args.opt] = [
                ...(args.args[args.action]![args.opt] = arg),
                arg,
              ];
            } else {
              args.args[args.action]![args.opt] = [
                args.args[args.action]![args.opt] as string,
                arg,
              ];
            }
          } else {
            args.args[args.action]![args.opt] = arg;
          }
        }

        return args;
      },
      { action: null, opt: null, args: {} } as {
        action: string | null;
        opt: string | null;
        args: Record<string, null | Record<string, string | string[] | null>>;
      }
    );

  if (!args.action)
    throw new Error(
      `You must run one of actions: ${Object.keys(validator).join(", ")} `
    );

  let line: {
    [x: string]: string | string[] | null;
  } | null = {
    ...args.args[args.action],
  };
  if (!Object.keys(line).length) line = null;

  if (!validator[args.action])
    throw new Error(
      `You must run one of actions: ${Object.keys(validator).join(", ")} `
    );

  const res = validator[args.action]!.parse(line);

  return { args: res, action: args.action } as {
    args: ValidateReturn<TSchema>;
    action: keyof ValidateReturn<TSchema>;
  };
};

export const createCommander = <TSchema extends ArgvSchemaActions>(
  schema: TSchema
) => new Commander<TSchema>(schema);

class Commander<
  TSchema extends ArgvSchemaActions,
  TCommands extends keyof ValidateReturn<TSchema> = ""
> {
  private args: ValidateReturn<TSchema>;
  private action: keyof ValidateReturn<TSchema>;
  private commands: Map<string, Function>;
  constructor(
    schema?: TSchema,
    commands = new Map(),
    args?: ValidateReturn<TSchema>,
    action?: keyof ValidateReturn<TSchema>
  ) {
    this.commands = commands;
    if (schema) {
      const validator = createArgv(schema);
      const { args, action } = validator.validate(process.argv);
      this.args = args;
      this.action = action;
    } else if (typeof args !== "undefined" && typeof action !== "undefined") {
      this.args = args;
      this.action = action;
    } else throw new Error("Error in the constructor of Commander");
  }
  on<TArg extends Exclude<keyof ValidateReturn<TSchema>, TCommands>>(
    arg: TArg extends string ? TArg : never,
    command: (value: ValidateReturn<TSchema>[TArg]) => void
  ) {
    this.commands.set(arg, command);
    return new Commander<TSchema, TCommands | TArg>(
      undefined,
      this.commands,
      this.args,
      this.action
    );
  }

  exec() {
    if (typeof this.action === "string") {
      const func = this.commands.get(this.action);
      if (func && func instanceof Function) func(this.args);
    }
  }
}
