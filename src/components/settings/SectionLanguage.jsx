import { useDispatch, useSelector } from "react-redux";

import { settingsOf, setLanguage } from "../../store/uiSlice";
import { useT } from "./i18n";
import { Group, Note, ChoiceRow } from "./primitives";

const LANGS = [
  { id: "ru", label: "Русский", native: "Русский" },
  { id: "en", label: "English", native: "English" },
];

export default function SectionLanguage() {
  const dispatch = useDispatch();
  const s = useSelector((st) => settingsOf(st.ui));
  const [t] = useT();

  return (
    <>
      <Group title={t("lang.title")}>
        {LANGS.map((l, i) => (
          <div key={l.id}>
            {i > 0 && <div className="ml-4 border-t border-[var(--border-soft)]" />}
            <ChoiceRow
              label={l.native}
              hint={l.id === "ru" ? "Russian" : "Английский"}
              selected={s.language === l.id}
              onSelect={() => dispatch(setLanguage(l.id))}
            />
          </div>
        ))}
      </Group>

      <Note tone="warn">{t("lang.honest")}</Note>
    </>
  );
}
