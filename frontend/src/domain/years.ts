// Historical year numbering has no year zero. Axis zero is 1 BCE.
export const minimumYear = -10000
export const maximumYear = new Date().getFullYear()
export const yearToAxis = (year: number) => year < 0 ? year + 1 : year
export const axisToYear = (axis: number) => axis <= 0 ? axis - 1 : axis
export const formatYear = (year: number, language = 'ru') => year < 0
  ? `${Math.abs(year)} ${language === 'tt' ? 'б. э. кадәр' : 'до н. э.'}`
  : String(year)
