import { Search } from "lucide-react";

/** Plain GET form: works without JavaScript and keeps the URL shareable. */
export function SearchBox({ placeholder, defaultValue, name = "q", bare = false }: { placeholder: string; defaultValue?: string; name?: string; bare?: boolean }) {
  const field = (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      />
    </div>
  );
  // `bare` is for use inside an existing <form> (nested forms are invalid HTML).
  return bare ? field : <form role="search">{field}</form>;
}
