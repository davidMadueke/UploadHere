import { Link } from "@tanstack/react-router";

import { AppearanceMenu } from "./appearance-menu";

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b px-4 py-2">
      <Link to="/" className="font-heading text-lg font-semibold tracking-tight">
        UploadHere
      </Link>
      <AppearanceMenu />
    </header>
  );
}
