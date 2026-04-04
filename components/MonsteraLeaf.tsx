interface MonsteraLeafProps {
  className?: string
  color?: string
  opacity?: number
}

export default function MonsteraLeaf({
  className = '',
  color = 'currentColor',
  opacity = 1,
}: MonsteraLeafProps) {
  return (
    <svg
      viewBox="0 0 380 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/*
        One compound path with fillRule="evenodd".
        The outer silhouette is clockwise (fills).
        The sinus shapes extend past the leaf edge so cuts reach the margin.
        The fenestration holes are closed ellipses that punch through cleanly.
      */}
      <path
        fillRule="evenodd"
        fill={color}
        d="
          M190,22
          C215,15 275,40 318,80
          C360,118 382,168 382,220
          C382,272 362,318 332,354
          C305,386 268,410 238,426
          C220,438 205,445 190,448
          C175,445 160,438 142,426
          C112,410 75,386 48,354
          C18,318 -2,272 -2,220
          C-2,168 20,118 62,80
          C105,40 165,15 190,22 Z

          M420,122
          C408,108 375,103 350,114
          C314,130 272,146 254,158
          C248,164 248,172 254,178
          C274,190 322,178 358,162
          C382,150 408,138 420,128 Z

          M420,222
          C408,208 374,203 350,216
          C312,235 272,250 258,263
          C253,268 253,276 258,281
          C276,292 320,280 356,263
          C380,250 408,238 420,228 Z

          M420,320
          C408,307 373,302 348,315
          C310,334 273,348 258,360
          C253,367 253,375 258,380
          C276,390 318,376 352,358
          C376,346 408,334 420,326 Z

          M-40,122
          C-28,108 5,103 30,114
          C66,130 108,146 126,158
          C132,164 132,172 126,178
          C106,190 58,178 22,162
          C-2,150 -28,138 -40,128 Z

          M-40,222
          C-28,208 6,203 30,216
          C68,235 108,250 122,263
          C127,268 127,276 122,281
          C104,292 60,280 24,263
          C0,250 -28,238 -40,228 Z

          M-40,320
          C-28,307 7,302 32,315
          C70,334 107,348 122,360
          C127,367 127,375 122,380
          C104,390 62,376 28,358
          C4,346 -28,334 -40,326 Z

          M218,80  A22,10,0,1,0,262,80  A22,10,0,1,0,218,80  Z
          M222,198 A22,10,0,1,0,266,198 A22,10,0,1,0,222,198 Z
          M224,297 A20,9,0,1,0,264,297  A20,9,0,1,0,224,297  Z
          M212,400 A14,7,0,1,0,240,400  A14,7,0,1,0,212,400  Z

          M118,80  A22,10,0,1,0,162,80  A22,10,0,1,0,118,80  Z
          M114,198 A22,10,0,1,0,158,198 A22,10,0,1,0,114,198 Z
          M116,297 A20,9,0,1,0,156,297  A20,9,0,1,0,116,297  Z
          M140,400 A14,7,0,1,0,168,400  A14,7,0,1,0,140,400  Z
        "
      />

      {/* Petiole stem */}
      <rect x="186" y="448" width="8" height="30" rx="4" fill={color} />

      {/* Midrib */}
      <path
        d="M190,22 L190,448"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.20"
      />

      {/* Primary veins — right lobes */}
      <path d="M190,95  Q265,72  330,52"  stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.16"/>
      <path d="M190,148 Q285,145 372,138" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.16"/>
      <path d="M190,248 Q288,245 374,240" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.16"/>
      <path d="M190,348 Q272,346 356,338" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.16"/>
      <path d="M190,408 Q238,406 290,400" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.13"/>

      {/* Primary veins — left lobes */}
      <path d="M190,95  Q115,72  50,52"   stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.16"/>
      <path d="M190,148 Q95,145 8,138"    stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.16"/>
      <path d="M190,248 Q92,245 6,240"    stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.16"/>
      <path d="M190,348 Q108,346 24,338"  stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.16"/>
      <path d="M190,408 Q142,406 90,400"  stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.13"/>
    </svg>
  )
}
