import { redirect } from "next/navigation";

/** Legacy path — canonical URL is /upload */
export default function UploadsRedirectPage() {
  redirect("/upload");
}
