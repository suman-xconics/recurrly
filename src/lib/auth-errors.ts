import { isClerkAPIResponseError } from "@clerk/expo";

export type AuthFieldErrors = Partial<Record<"email" | "password" | "name" | "code" | "form", string>>;

const fieldMap: Record<string, keyof AuthFieldErrors> = {
  email_address: "email",
  emailAddress: "email",
  identifier: "email",
  password: "password",
  first_name: "name",
  firstName: "name",
  code: "code",
};

export function friendlyAuthError(error: unknown): AuthFieldErrors {
  if (isClerkAPIResponseError(error)) {
    return error.errors.reduce<AuthFieldErrors>((fields, item) => {
      const param = item.meta?.paramName;
      const key = param ? fieldMap[param] : undefined;
      const message = item.longMessage || item.message || "Please check this field and try again.";

      if (key) {
        fields[key] = message;
      } else if (!fields.form) {
        fields.form = message;
      }

      return fields;
    }, {});
  }

  if (error instanceof Error) {
    return { form: error.message };
  }

  return { form: "Something went wrong. Please try again." };
}

export function mergeFieldErrors(...errors: AuthFieldErrors[]) {
  return errors.reduce<AuthFieldErrors>((merged, current) => ({ ...merged, ...current }), {});
}
