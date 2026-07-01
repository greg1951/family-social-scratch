"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, PlusCircle, RefreshCw, Save } from "lucide-react";
import { startTransition, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  getSupportEnvironmentsAction,
  upsertSupportEnvironmentAction,
} from "@/app/(support)/(logged-in)/env-list/actions";
import {
  SUPPORT_ENV_PNEUMONICS,
  type SupportEnvPneumonic,
  type SupportEnvironmentListItem,
  upsertSupportEnvironmentSchema,
} from "@/components/db/types/support";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function environmentBadgeClass(isAvailable: boolean) {
  return isAvailable
    ? "bg-emerald-100 text-emerald-700"
    : "bg-rose-100 text-rose-700";
}

function buildBaseUrl(envPneumonic: SupportEnvPneumonic, websiteDomain: string) {
  const normalizedDomain = websiteDomain.trim();
  if (!normalizedDomain) {
    return "";
  }

  return envPneumonic === "prod" ? normalizedDomain : `${ envPneumonic }.${ normalizedDomain }`;
}

function toEditableState(environment?: SupportEnvironmentListItem) {
  if (!environment) {
    return {
      id: undefined,
      envPneumonic: "dev" as SupportEnvPneumonic,
      websiteDomain: "my-family-social.com",
      isAvailable: true,
      bypassUrl: "",
      supportEmail: "",
    };
  }

  return {
    id: environment.id,
    envPneumonic: environment.envPneumonic,
    websiteDomain: environment.websiteDomain,
    isAvailable: environment.isAvailable,
    bypassUrl: environment.bypassUrl ?? "",
    supportEmail: environment.supportEmail ?? "",
  };
}

function sortEnvironments(items: SupportEnvironmentListItem[]) {
  const orderMap = new Map(SUPPORT_ENV_PNEUMONICS.map((value, index) => [value, index]));

  return [...items].sort((a, b) => {
    const orderA = orderMap.get(a.envPneumonic) ?? Number.MAX_SAFE_INTEGER;
    const orderB = orderMap.get(b.envPneumonic) ?? Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.id - b.id;
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ListEnvironmentsFormProps = {
  initialEnvironments: SupportEnvironmentListItem[];
};

export default function ListEnvironmentsForm({ initialEnvironments }: ListEnvironmentsFormProps) {
  const sortedInitialEnvironments = sortEnvironments(initialEnvironments);

  const [environments, setEnvironments] = useState<SupportEnvironmentListItem[]>(
    sortedInitialEnvironments,
  );
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<number | null>(
    sortedInitialEnvironments[0]?.id ?? null,
  );
  const [formState, setFormState] = useState(() => toEditableState(sortedInitialEnvironments[0]));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isEditing = selectedEnvironmentId !== null;

  const displayUrl = useMemo(
    () => buildBaseUrl(formState.envPneumonic, formState.websiteDomain),
    [formState.envPneumonic, formState.websiteDomain],
  );
  const bypassUrlPlaceholder = useMemo(() => {
    const domain = formState.websiteDomain.trim() || "my-family-social.com";
    return `https://${ formState.envPneumonic }.status.${ domain }/bypass`;
  }, [formState.envPneumonic, formState.websiteDomain]);

  function onSelectEnvironment(environment: SupportEnvironmentListItem) {
    setSelectedEnvironmentId(environment.id);
    setFormState(toEditableState(environment));
    setFormError(null);
  }

  function resetToNewEnvironment() {
    setSelectedEnvironmentId(null);
    setFormState(toEditableState());
    setFormError(null);
  }

  async function refreshEnvironments() {
    setIsRefreshing(true);

    startTransition(async () => {
      const refreshed = await getSupportEnvironmentsAction();
      const sorted = sortEnvironments(refreshed);
      setEnvironments(sorted);
      setIsRefreshing(false);

      if (selectedEnvironmentId !== null) {
        const matched = sorted.find((item) => item.id === selectedEnvironmentId);
        if (matched) {
          setFormState(toEditableState(matched));
          return;
        }
      }

      if (sorted[0]) {
        setSelectedEnvironmentId(sorted[0].id);
        setFormState(toEditableState(sorted[0]));
      } else {
        resetToNewEnvironment();
      }
    });
  }

  async function onSaveEnvironment() {
    setFormError(null);

    const payload = {
      id: formState.id,
      envPneumonic: formState.envPneumonic,
      websiteDomain: formState.websiteDomain,
      isAvailable: formState.isAvailable,
      bypassUrl: formState.bypassUrl.trim() ? formState.bypassUrl.trim() : null,
      supportEmail: formState.supportEmail.trim() ? formState.supportEmail.trim() : null,
    };

    const parsed = upsertSupportEnvironmentSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Unable to save environment.");
      return;
    }

    setIsSaving(true);

    startTransition(async () => {
      const result = await upsertSupportEnvironmentAction(parsed.data);
      setIsSaving(false);

      if (!result.success) {
        setFormError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setFormError(null);

      setEnvironments((previous) => sortEnvironments([
        ...previous.filter((item) => item.id !== result.environment.id),
        result.environment,
      ]));
      setSelectedEnvironmentId(result.environment.id);
      setFormState(toEditableState(result.environment));
    });
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(10,64,79,0.95),rgba(24,115,143,0.9)_50%,rgba(249,197,121,0.85))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(6,34,52,0.9)] sm:px-8">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#def8ff]">
            My Family Social Support
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            Environment Configuration
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#eafcff]">
            Configure environment routing values used across email links and support workflows.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-[#c8d8df] bg-[#eef5f8] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4f7a8c] transition hover:bg-[#dcedf4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5d8191]"
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to Main Page
            </Link>
          </div>
        </div>

        <div className="font-app rounded-[2rem] border border-[#c8d8df] bg-white/95 p-6 shadow-[0_20px_80px_rgba(19,55,71,0.10)] sm:p-8">
          <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5d8191]">
                  Environments ({ environments.length })
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={ isRefreshing }
                  onClick={ refreshEnvironments }
                  className="text-[#4f7a8c] hover:text-[#153445]"
                >
                  <RefreshCw className={ `size-3.5 ${ isRefreshing ? "animate-spin" : "" }` } />
                  <span className="sr-only">Refresh environments</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={ resetToNewEnvironment }
                  className="rounded-full border-[#c8d8df] text-[#2b6a87] hover:bg-[#eef5f8]"
                >
                  <PlusCircle className="mr-1.5 size-3.5" />
                  Add
                </Button>
              </div>

              { environments.length === 0 ? (
                <p className="rounded-2xl border border-[#dbe6eb] bg-[#f7fbfd] px-5 py-8 text-center text-sm text-[#5d8191]">
                  No environments found. Add one to get started.
                </p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  { environments.map((environment) => (
                    <li key={ environment.id }>
                      <button
                        type="button"
                        onClick={ () => onSelectEnvironment(environment) }
                        className={ `w-full rounded-2xl border px-4 py-3 text-left transition ${ selectedEnvironmentId === environment.id
                          ? "border-[#2b6a87] bg-[#ebf6fb]"
                          : "border-[#dbe6eb] bg-[#f7fbfd] hover:border-[#a8c8d8] hover:bg-[#eef5f8]"
                          }` }
                      >
                        <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#153445]">
                              { environment.envPneumonic }
                            </p>
                            <p className="mt-0.5 truncate text-xs text-[#5d8191]">
                              { buildBaseUrl(environment.envPneumonic, environment.websiteDomain) }
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              <span className={ `rounded-full px-2 py-0.5 text-[10px] font-semibold ${ environmentBadgeClass(environment.isAvailable) }` }>
                                { environment.isAvailable ? "Available" : "Unavailable" }
                              </span>
                            </div>
                            <p className="mt-1 text-[10px] text-[#7a99a6]">
                              { formatDate(environment.updatedAt) }
                            </p>
                          </div>
                          <ChevronRight className="mt-0.5 size-4 shrink-0 text-[#a8c8d8]" />
                        </div>
                      </button>
                    </li>
                  )) }
                </ul>
              ) }
            </div>

            <div className="rounded-2xl border border-[#dbe6eb] bg-[#f7fbfd] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5d8191]">
                { isEditing ? "Edit Environment" : "Add Environment" }
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[#153445]">
                { isEditing ? `Environment #${ formState.id }` : "Create a new environment" }
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f7a8c]">
                    Pneumonic
                  </span>
                  <Select
                    value={ formState.envPneumonic }
                    onValueChange={ (value) =>
                      setFormState((prev) => ({
                        ...prev,
                        envPneumonic: value as SupportEnvPneumonic,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full border-[#c8d8df] bg-white text-[#153445]">
                      <SelectValue placeholder="Select an environment" />
                    </SelectTrigger>
                    <SelectContent>
                      { SUPPORT_ENV_PNEUMONICS.map((value) => (
                        <SelectItem key={ value } value={ value }>
                          { value }
                        </SelectItem>
                      )) }
                    </SelectContent>
                  </Select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f7a8c]">
                    Website Domain
                  </span>
                  <Input
                    value={ formState.websiteDomain }
                    onChange={ (event) =>
                      setFormState((prev) => ({ ...prev, websiteDomain: event.target.value }))
                    }
                    placeholder="my-family-social.com"
                    className="border-[#c8d8df] bg-white text-[#153445]"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f7a8c]">
                    Support Email
                  </span>
                  <Input
                    value={ formState.supportEmail }
                    onChange={ (event) =>
                      setFormState((prev) => ({ ...prev, supportEmail: event.target.value }))
                    }
                    placeholder="support@my-family-social.com"
                    className="border-[#c8d8df] bg-white text-[#153445]"
                  />
                </label>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-3 rounded-xl border border-[#dbe6eb] bg-white px-4 py-3">
                    <Checkbox
                      checked={ formState.isAvailable }
                      onCheckedChange={ (checked) =>
                        setFormState((prev) => ({ ...prev, isAvailable: checked === true }))
                      }
                    />
                    <span className="text-sm font-medium text-[#153445]">
                      Environment is available
                    </span>
                  </label>
                </div>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f7a8c]">
                    Bypass URL ({ formState.isAvailable ? "optional" : "required" })
                  </span>
                  <Input
                    value={ formState.bypassUrl }
                    onChange={ (event) =>
                      setFormState((prev) => ({ ...prev, bypassUrl: event.target.value }))
                    }
                    placeholder={ bypassUrlPlaceholder }
                    className="border-[#c8d8df] bg-white text-[#153445]"
                  />
                </label>
              </div>

              <div className="mt-5 rounded-xl border border-[#dbe6eb] bg-white px-4 py-3 text-sm text-[#3d6070]">
                <p>
                  Effective URL: <span className="font-semibold text-[#153445]">{ displayUrl || "—" }</span>
                </p>
                <p className="mt-1 text-xs text-[#5d8191]">
                  `prod` maps to the base domain, while other values prepend the pneumonic.
                </p>
              </div>

              { formError && <p className="mt-4 text-sm text-rose-600">{ formError }</p> }

              <div className="mt-5 flex items-center justify-end">
                <Button
                  type="button"
                  onClick={ onSaveEnvironment }
                  disabled={ isSaving }
                  className="rounded-full bg-[#1f6f8f] px-5 text-white hover:bg-[#185a73]"
                >
                  <Save className="mr-2 size-4" />
                  { isSaving ? "Saving…" : isEditing ? "Save Changes" : "Create Environment" }
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}