import { useState } from "react";
import { CheckIcon, LinkIcon } from "./Icons";

const isLocalDev = () => {
  if (typeof window === "undefined") {
    return true;
  }

  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host.endsWith(".local")
  );
};

export const ShareAppLink = () => {
  const [copied, setCopied] = useState(false);

  if (isLocalDev()) {
    return null;
  }

  const appUrl = window.location.origin;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = appUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="space-y-3">
      <div className="section-heading">
        <h3>Share app</h3>
        <p>Send this link to install on any phone</p>
      </div>
      <div className="native-card px-4 py-4">
        <p className="break-all text-sm leading-6 text-secondary">{appUrl}</p>
        <button type="button" className="secondary-button mt-4 w-full" onClick={() => void copyLink()}>
          {copied ? <CheckIcon className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
          {copied ? "Link copied" : "Copy share link"}
        </button>
      </div>
    </section>
  );
};
