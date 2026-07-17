import { useTheme } from '../../theme/ThemeProvider';
import bannerDark from '../../assets/dashboard-banner-dark.png';
import bannerLight from '../../assets/dashboard-banner-light.png';

export function DashboardBanner() {
  const { isLight } = useTheme();
  const src = isLight ? bannerLight : bannerDark;

  return (
    <section className="flex w-full justify-center" aria-label="BlazeAudit">
      <img
        src={src}
        alt="BlazeAudit — Fire safety documentation & reporting"
        className="block h-auto w-full max-w-[min(100%,64rem)] object-contain object-center"
        draggable={false}
      />
    </section>
  );
}
