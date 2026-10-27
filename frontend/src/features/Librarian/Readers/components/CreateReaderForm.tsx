import { useId, useState, type FormEvent } from "react";
import { ChevronDown } from "lucide-react";
import {
  bondLabels,
  createReaderSchema,
  maskPhone,
  type ReaderBond,
  type ReaderFormValues,
} from "../reader.model";

interface CreateReaderFormProps {
  onCancel: () => void;
  onSubmit?: (values: ReaderFormValues) => void;
  courseOptions?: string[];
}

type FormState = Omit<ReaderFormValues, "bond"> & { bond: ReaderBond | "" };
type FormErrors = Partial<Record<keyof ReaderFormValues, string>>;

const initialValues: FormState = {
  name: "",
  email: "",
  phone: "",
  bond: "",
  course: "",
};

const bondOptions = Object.keys(bondLabels) as ReaderBond[];

const inputClass =
  "w-full rounded-lg border border-[#E7DCC4] bg-white px-3 py-2 text-sm text-[#3B2A1A] placeholder:text-[#9A8B76] focus:border-[#9A5B00] focus:outline-none";
const labelClass = "mb-1 block text-xs font-semibold";
const errorClass = "mt-1 text-xs text-red-700";

export default function CreateReaderForm({
  onCancel,
  onSubmit,
  courseOptions = [],
}: CreateReaderFormProps) {
  const id = useId();
  const [values, setValues] = useState<FormState>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  const isStudent = values.bond === "student";

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setValues((current) => ({ ...current, [field]: value }));

  const handleBondChange = (bond: ReaderBond) =>
    setValues((current) => ({
      ...current,
      bond,
      course: bond === "student" ? current.course : "",
    }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = createReaderSchema.safeParse(values);

    if (!result.success) {
      const formattedErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof ReaderFormValues | undefined;
        if (!fieldName || formattedErrors[fieldName]) return;
        formattedErrors[fieldName] =
          fieldName === "bond" ? "Selecione o tipo de vínculo." : issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setErrors({});
    onSubmit?.(result.data);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor={`${id}-name`} className={labelClass}>
          Nome
        </label>
        <input
          id={`${id}-name`}
          type="text"
          autoFocus
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          className={inputClass}
        />
        {errors.name && <p className={errorClass}>{errors.name}</p>}
      </div>

      <div>
        <label htmlFor={`${id}-email`} className={labelClass}>
          E-mail
        </label>
        <input
          id={`${id}-email`}
          type="email"
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
          className={inputClass}
        />
        {errors.email && <p className={errorClass}>{errors.email}</p>}
      </div>

      <div>
        <label htmlFor={`${id}-phone`} className={labelClass}>
          Telefone
        </label>
        <input
          id={`${id}-phone`}
          type="tel"
          placeholder="(11) 99999-9999"
          value={values.phone}
          onChange={(e) => setField("phone", maskPhone(e.target.value))}
          className={inputClass}
        />
        {errors.phone && <p className={errorClass}>{errors.phone}</p>}
      </div>

      <fieldset>
        <legend className={labelClass}>Tipo vínculo</legend>
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B5A45]">
          {bondOptions.map((bond) => (
            <label key={bond} className="flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                name={`${id}-bond`}
                value={bond}
                checked={values.bond === bond}
                onChange={() => handleBondChange(bond)}
                className="accent-[#9A5B00]"
              />
              {bondLabels[bond]}
            </label>
          ))}
        </div>
        {errors.bond && <p className={errorClass}>{errors.bond}</p>}
      </fieldset>

      {isStudent && (
        <div>
          <label htmlFor={`${id}-course`} className={labelClass}>
            Curso
          </label>
          <div className="relative">
            <select
              id={`${id}-course`}
              value={values.course}
              onChange={(e) => setField("course", e.target.value)}
              className={`${inputClass} appearance-none pr-9 ${
                values.course ? "" : "text-[#9A8B76]"
              }`}
            >
              <option value="">Selecione</option>
              {courseOptions.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5A45]"
            />
          </div>
          {errors.course && <p className={errorClass}>{errors.course}</p>}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[#9A5B00] bg-white px-4 py-2 text-sm font-medium text-[#3B2A1A] hover:bg-[#F9F0DC]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Confirmar
        </button>
      </div>
    </form>
  );
}