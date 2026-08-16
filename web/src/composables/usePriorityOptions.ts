import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { PRIORITY_OPTIONS } from "../utils/priority";

export function usePriorityOptions() {
  const { t } = useI18n();

  return computed(() =>
    PRIORITY_OPTIONS.map(({ value, level }) => ({
      value,
      label: t(`priority.${level}`),
    })),
  );
}
