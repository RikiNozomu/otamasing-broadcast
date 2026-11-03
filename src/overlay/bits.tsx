import logo from "../logo-white.svg?raw";
import { flagUrl } from "../lib/flags";

export const Logo = () => <div className="logo" dangerouslySetInnerHTML={{ __html: logo }} />;

export function Flag({ code, className = "flag" }: { code: string; className?: string }) {
  const url = flagUrl(code);
  return url ? <img className={className} src={url} alt={code} /> : null;
}
