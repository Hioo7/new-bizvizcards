import bizvizLogo from "@assets/brand/bizvizlogo.svg";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  FOOTER_LINK_COLUMNS,
} from "@features/landing/config/content";

export default function Footer() {
  return (
    <footer className="bg-neutral py-12 text-neutral-content">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <img
              src={bizvizLogo}
              alt="BizVizCards"
              className="mb-4 block h-8 w-auto brightness-0 invert"
            />
            <p className="text-xs leading-relaxed text-neutral-content/70">
              Modern technology to help businesses transform their digital
              identity and design.
            </p>
          </div>

          {FOOTER_LINK_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h4 className="mb-4 text-sm font-semibold text-base-100">
                {column.heading}
              </h4>
              <ul className="space-y-2 text-xs">
                {column.items.map((item) => (
                  <li key={item}>
                    <a href="#" className="transition-colors hover:text-base-100">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-4 text-sm font-semibold text-base-100">
              Contact Us
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="transition-colors hover:text-base-100"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT_PHONE_HREF}`}
                  className="transition-colors hover:text-base-100"
                >
                  {CONTACT_PHONE_DISPLAY}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-content/20 pt-6 text-center text-xs text-neutral-content/60">
          © {new Date().getFullYear()} BizVizCards. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
