// CSS device dimensions and pixel ratios used by iOS launch images.
const devices = [[320,568,2],[375,667,2],[414,896,2],[375,812,3],[390,844,3],[393,852,3],[402,874,3],[414,896,3],[428,926,3],[430,932,3],[440,956,3],[768,1024,2],[810,1080,2],[820,1180,2],[834,1194,2],[1024,1366,2]];
export function PwaSplashLinks() {
  return <>{devices.flatMap(([w,h,ratio]) => ["portrait","landscape"].map(orientation => <link key={`${w}-${h}-${ratio}-${orientation}`} rel="apple-touch-startup-image" href={`/splash-${(orientation === "portrait" ? w : h)*ratio}x${(orientation === "portrait" ? h : w)*ratio}.png`} media={`(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: ${orientation})`}/>))}</>;
}
