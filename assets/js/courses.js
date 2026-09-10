// Golf course list for the "Course" dropdown on the round entry form,
// focused on the Treasure Valley (Boise/Meridian/Nampa/Caldwell/Eagle area)
// plus a few notable courses elsewhere in Idaho. Not tailored to any
// specific team's schedule -- add/remove/reorder to match the courses your
// team actually plays. Players whose round was somewhere not listed here
// (including any out-of-state course) use the "Other" option to type it in
// by hand.
//
// `pars` (an 18-length array, one par per hole) is only present where it
// was verified against a real scorecard -- see each entry's `source`. When
// present, selecting that course on the entry form fills in and locks every
// hole's par; entries without `pars` leave Par editable, same as "Other".
//
// `tees` (optional array of { name, rating, slope }, one per tee box, also
// only from a verified source -- see each entry's `teeSource`) drives the
// Tees dropdown: picking one fills in that tee's Course Rating and Slope
// Rating for computing the round's score differential. Courses without
// `tees` fall back to manual tee name/rating/slope entry, same as "Other".
//
// A tee entry can also carry `yardages` (an 18-length array, hole 1 first)
// to sharpen the SG:OTT stat in stats.js -- courses without it fall back to
// a typical yardage for the hole's par. Where yardages came from a
// different source than `source`/`teeSource` (e.g. pulled in bulk from an
// API rather than a scorecard already cited above), the course carries a
// `yardageSource` citing that instead.
//
// Courses citing opengolfapi.org come from OpenGolfAPI's community/OSM-
// derived course database (ODbL 1.0 -- see https://opengolfapi.org/attribution).
// Its course-config granularity doesn't always match a facility 1:1 (e.g. a
// club's par-3 companion course lists as its own record); only the config
// matching this file's existing pars/hole count was used. A `rating: null`
// on a tee means OpenGolfAPI has no course rating on file for it -- yardages
// are still used, but that tee won't contribute to score differential.
const IDAHO_COURSES = [
  {
    name: 'BanBury Golf Course', city: 'Eagle',
    pars: [4,5,3,5,3,4,4,3,4,4,4,5,4,3,4,3,4,5],
    source: 'https://www.golflink.com/golf-courses/id/eagle/banbury-golf-club',
    // Tee data below is from OpenGolfAPI, replacing an earlier GolfNow/
    // GolfCourseAPI-sourced version that had Black as the longest tee and Red
    // as the second-shortest -- backwards from how the course actually plays:
    // Red is the back/championship tee here, confirmed directly by the coach.
    tees: [
      { name: 'Red', rating: 72.4, slope: 135, yardages: [260,428,119,451,121,337,312,126,341,333,320,464,318,161,374,102,262,435] },
      { name: 'Red/Black', rating: 70.8, slope: 129, yardages: [402,535,154,518,147,427,387,188,402,410,387,544,411,219,419,167,337,499] },
      { name: 'Black', rating: 70.8, slope: 129, yardages: [402,535,183,518,170,481,419,204,402,410,416,544,423,249,443,167,337,499] },
      { name: 'Black/White', rating: 68.6, slope: 123, yardages: [334,510,136,496,147,352,352,144,390,385,387,517,346,189,419,116,302,478] },
      { name: 'White', rating: 72.5, slope: 137, yardages: [296,474,136,471,130,352,352,144,367,371,342,496,346,189,401,116,290,460] },
      { name: 'Blue', rating: 65, slope: 114, yardages: [334,510,154,496,147,387,387,188,390,385,387,517,401,219,419,155,302,478] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'Boise Ranch Golf Course', city: 'Boise',
    pars: [4,3,4,3,5,4,4,3,5,5,4,3,5,4,4,3,4,4],
    source: 'https://www.golflink.com/golf-courses/id/boise/boise-ranch-golf-course-inc',
    tees: [
      { name: 'Black', rating: 70.6, slope: 125, yardages: [440,164,361,179,537,403,398,151,510,524,376,170,633,401,404,162,374,420] },
      { name: 'Gold', rating: 68.2, slope: 116, yardages: [377,131,337,149,491,378,371,135,472,501,366,158,587,362,373,143,361,378] },
      { name: 'Silver', rating: 66.9, slope: 113, yardages: [330,131,337,118,457,378,371,135,472,501,355,158,510,362,373,104,351,378] }
    ],
    teeSource: 'https://www.golfpass.com/travel-advisor/courses/4924-boise-ranch-golf-course',
    yardageSource: 'https://www.golfcourseapi.com/'
  },
  {
    name: 'Centennial Golf Course', city: 'Nampa',
    pars: [4,4,4,3,5,4,3,5,4,4,5,3,4,4,5,3,4,4],
    source: 'https://www.golflink.com/golf-courses/id/nampa/centennial-golf-course',
    tees: [
      { name: 'Blue', rating: 69.8, slope: 116, yardages: [411,378,415,183,530,401,144,456,374,375,532,128,388,455,514,178,368,360] },
      { name: 'White', rating: 68.4, slope: 111, yardages: [394,365,386,145,466,372,130,456,374,375,468,128,388,410,472,161,368,350] },
      { name: 'Red', rating: 64.8, slope: 104, yardages: [357,325,356,89,399,342,113,388,355,334,423,100,357,344,392,149,318,342] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'Crane Creek Country Club', city: 'Boise',
    pars: [4,4,3,5,4,5,3,4,4,4,4,3,5,4,3,4,4,4],
    source: 'https://www.golflink.com/golf-courses/id/boise/crane-creek-country-club-3053'
    // GolfCourseAPI has this course, but its hole-by-hole pars disagree with
    // the GolfLink card above from hole 11 on (and total to 72, not 71) --
    // not safe to attach its yardages without knowing which par sequence is
    // actually right. Left out until that's resolved by hand.
  },
  { name: 'Circling Raven Golf Club', city: 'Worley' },
  { name: "Coeur d'Alene Resort Golf Course", city: "Coeur d'Alene" },
  {
    name: 'Eagle Hills Golf Course', city: 'Eagle',
    pars: [4,4,5,4,3,5,4,3,4,5,3,4,4,3,4,4,4,5],
    source: 'https://www.golflink.com/golf-courses/id/eagle/eagle-hills-golf-course',
    tees: [
      { name: 'Black', rating: 70.5, slope: 125, yardages: [348,359,470,383,225,468,439,129,364,514,144,407,360,170,352,374,415,512] },
      { name: 'Blue', rating: 68.5, slope: 122, yardages: [338,350,459,375,175,444,399,118,348,486,121,379,346,144,342,374,384,489] },
      { name: 'White', rating: 65.3, slope: 117, yardages: [299,335,388,367,125,396,358,107,303,427,98,347,293,125,322,332,367,430] },
      { name: 'Red', rating: 62.7, slope: 104, yardages: [293,320,378,326,100,330,326,106,291,394,84,262,265,100,284,305,267,430] }
    ],
    teeSource: 'https://www.golfcourseapi.com/',
    yardageSource: 'https://www.golfcourseapi.com/'
  },
  {
    name: 'Fairview Golf Course', city: 'Caldwell',
    // A 9-hole course -- GolfCourseAPI's only card for it repeats the same
    // 9 holes for the back 9, which is why holes 1-9 and 10-18 match below.
    pars: [4,3,4,3,5,4,4,3,5,4,3,4,3,5,4,4,3,5],
    source: 'https://www.golfcourseapi.com/',
    tees: [
      { name: 'Blue', rating: 64.0, slope: 97, yardages: [328,139,246,155,423,304,325,125,426,328,139,246,155,423,304,325,125,426] },
      { name: 'Red', rating: 61.8, slope: 94, yardages: [303,117,225,135,400,288,212,106,391,303,117,225,135,400,288,212,106,391] },
      { name: 'Yellow', rating: 57.4, slope: 81, yardages: [195,79,199,107,344,183,134,96,334,195,79,199,107,344,183,134,96,334] }
    ],
    teeSource: 'https://www.golfcourseapi.com/',
    yardageSource: 'https://www.golfcourseapi.com/'
  },
  {
    name: 'Falcon Crest Golf Club', city: 'Kuna',
    // Hole 17 confirmed par 4 by the coach (the GolfLink card this was
    // originally sourced from had it as a 3; OpenGolfAPI's Championship 18
    // agreed with the par-4 and prompted the fix). OpenGolfAPI's tees for
    // this course ("Back"/"Middle", no rating on file) don't correspond to
    // the named Black/Red/White/Yellow tees below, so no yardages merged.
    pars: [4,5,4,4,3,5,4,3,4,3,5,4,3,4,4,5,4,4],
    source: 'https://www.golflink.com/golf-courses/id/kuna/falcon-crest-golf-club-15751',
    tees: [
      { name: 'Black', rating: 71.4, slope: 130 },
      { name: 'Red', rating: 68.3, slope: 126 },
      { name: 'White', rating: 66.7, slope: 114 },
      { name: 'Yellow', rating: 63.7, slope: 101 }
    ],
    teeSource: 'https://www.golfpass.com/travel-advisor/courses/25985-falcon-crest-golf-club-championship-18-course'
  },
  {
    name: 'Hillcrest Country Club', city: 'Boise',
    pars: [4,5,5,3,4,4,4,3,4,4,4,4,3,4,4,5,3,4],
    source: 'https://www.golflink.com/golf-courses/id/boise/hillcrest-country-club-inc',
    tees: [
      // Rating/slope below are as originally sourced from GolfPass; GolfCourseAPI
      // independently reports this course's Black tee as 73/133 and Black/White as
      // 71.9/129 -- close-but-not-identical for Black, and a real 6-point slope gap
      // for Black/White. Worth a USGA NCRDB cross-check before fully trusting either.
      { name: 'Black', rating: 72.6, slope: 134, yardages: [404,536,594,181,449,414,418,196,412,355,459,405,211,439,295,535,133,394] },
      { name: 'Black/White', rating: 71.2, slope: 135, yardages: [404,516,594,151,449,371,418,196,412,355,459,398,211,416,295,514,118,341] },
      { name: 'White', rating: 69.9, slope: 131, yardages: [393,516,513,151,397,371,381,173,401,339,409,398,196,416,286,514,118,341] },
      { name: 'Green', rating: 68.2, slope: 126, yardages: [382,492,460,136,368,357,363,151,344,332,369,394,176,402,278,491,109,319] },
      { name: 'Green/Gold', rating: 66.9, slope: 123, yardages: [382,492,395,136,310,357,363,151,344,332,342,350,176,402,278,491,109,319] }
    ],
    teeSource: 'https://www.golfpass.com/travel-advisor/courses/4926-hillcrest-country-club',
    yardageSource: 'https://www.golfcourseapi.com/'
  },
  {
    name: 'Jug Mountain Ranch', city: 'McCall',
    pars: [4,5,3,4,4,4,5,3,4,3,4,4,5,3,4,5,4,4],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Gold', rating: 74.3, slope: 136, yardages: [403,538,196,487,336,474,587,210,485,201,413,336,547,186,412,597,422,435] },
      { name: 'Blue', rating: 71.3, slope: 131, yardages: [394,503,168,463,313,443,557,168,454,174,375,313,525,147,373,555,378,374] },
      { name: 'White', rating: 68.5, slope: 121, yardages: [380,458,160,440,290,397,523,133,392,164,369,258,510,130,336,500,329,336] },
      { name: 'Red', rating: 68.7, slope: 124, yardages: [308,380,115,379,268,345,495,106,348,127,331,227,323,106,291,404,297,238] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    // McCall Golf Club is a 27-hole facility played as three named 18-hole
    // combinations of its Aspen/Birch/Cedar nines -- each is its own entry
    // below since a round is played on one specific combo, not the whole 27.
    name: 'McCall Golf Club (Aspen/Birch)', city: 'McCall',
    pars: [4,3,4,4,5,4,4,3,4,4,4,3,4,5,5,3,4,4],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Blue', rating: 69.5, slope: 117, yardages: [370,192,378,388,458,354,330,201,431,407,329,149,316,507,471,141,404,400] },
      { name: 'White', rating: 68.2, slope: 114, yardages: [352,169,353,373,416,326,318,180,420,399,317,130,296,476,458,113,396,370] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'McCall Golf Club (Birch/Cedar)', city: 'McCall',
    pars: [4,4,3,4,5,5,3,4,4,4,5,4,3,4,3,5,3,4],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Blue', rating: 69.7, slope: 117, yardages: [407,329,149,316,507,471,141,404,400,302,521,431,187,369,155,580,193,342] },
      { name: 'White', rating: 67.5, slope: 115, yardages: [399,317,130,296,476,458,113,396,370,271,481,399,158,348,132,535,139,318] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'McCall Golf Club (Cedar/Aspen)', city: 'McCall',
    pars: [4,5,4,3,4,3,5,3,4,4,3,4,4,5,4,4,3,4],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Blue', rating: 69.8, slope: 120, yardages: [302,521,431,187,369,155,580,193,342,370,192,378,388,458,354,330,201,431] },
      { name: 'White', rating: 67.4, slope: 116, yardages: [271,481,399,158,348,132,535,139,318,352,169,353,373,416,326,318,180,420] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'Whitetail Golf Club', city: 'McCall',
    pars: [4,5,3,5,4,3,4,4,4,4,4,5,4,3,5,3,4,4],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Black', rating: 72.5, slope: 122, yardages: [390,510,225,548,419,205,432,310,385,460,390,519,461,243,540,201,460,468] },
      { name: 'Black/Rust', rating: 70.8, slope: 120, yardages: [390,510,186,528,419,205,432,310,385,440,365,495,432,221,507,172,401,431] },
      { name: 'Rust', rating: 69.8, slope: 116, yardages: [338,460,186,528,396,169,385,295,351,440,365,495,432,221,507,172,401,431] },
      { name: 'Rust/White', rating: 68.4, slope: 114, yardages: [338,460,186,528,396,169,385,295,351,417,323,460,415,165,486,159,377,372] },
      { name: 'White', rating: 67.8, slope: 112, yardages: [326,448,139,502,377,128,353,272,322,417,323,460,415,165,486,159,377,372] },
      { name: 'White/Gold', rating: 64.6, slope: 107, yardages: [326,448,139,408,284,128,353,272,322,381,323,402,374,148,470,106,315,326] },
      { name: 'Gold', rating: 63.1, slope: 101, yardages: [277,391,90,408,284,106,286,272,266,381,236,402,374,148,470,106,315,326] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'Lakeview Golf Club', city: 'Meridian',
    pars: [4,4,4,3,5,4,3,4,5,4,5,4,3,5,4,4,3,4],
    source: 'https://www.golflink.com/golf-courses/id/meridian/lakeview-golf-club',
    tees: [
      { name: 'Blue', rating: 71.0, slope: 136, yardages: [362,398,330,178,523,380,153,355,604,383,462,380,135,500,354,358,172,366] },
      { name: 'White', rating: 68.5, slope: 125, yardages: [314,389,318,160,483,371,144,332,537,372,448,366,128,465,342,346,164,355] },
      { name: 'Red', rating: 65.4, slope: 114, yardages: [268,332,283,120,435,288,138,289,488,326,363,298,120,410,278,302,159,313] }
    ],
    teeSource: 'https://www.golfcourseapi.com/',
    yardageSource: 'https://www.golfcourseapi.com/'
  },
  {
    name: 'Pierce Park Greens', city: 'Boise',
    // A genuine 9-hole par-3 executive course -- GolfCourseAPI only has one
    // 9-hole card for it, repeated here to fill the file's assumed 18-hole
    // shape (same treatment as Fairview Golf Course above).
    pars: [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
    source: 'https://www.golfcourseapi.com/',
    tees: [
      { name: 'Wood', rating: 24.9, slope: 60, yardages: [76,82,98,94,83,90,76,114,98,76,82,98,94,83,90,76,114,98] }
    ],
    teeSource: 'https://www.golfcourseapi.com/',
    yardageSource: 'https://www.golfcourseapi.com/'
  },
  {
    name: 'Plantation Country Club', city: 'Boise',
    pars: [5,4,4,4,4,4,3,5,3,5,4,3,4,3,4,3,4,5],
    source: 'https://www.golflink.com/golf-courses/id/boise/plantation-country-club'
  },
  {
    name: 'Purple Sage Golf Course', city: 'Caldwell',
    pars: [4,4,5,4,3,4,4,3,5,4,4,5,3,4,4,3,4,4],
    source: 'https://www.golflink.com/golf-courses/id/caldwell/purple-sage-golf-course',
    tees: [
      { name: 'Grey', rating: 71.1, slope: 126, yardages: [375,381,541,418,166,383,408,223,533,384,410,558,177,402,417,190,400,352] },
      { name: 'Copper', rating: 69.2, slope: 125, yardages: [347,363,513,397,153,361,392,194,480,362,384,531,155,380,384,175,377,337] },
      { name: 'Copper/Green', rating: 66.2, slope: 114, yardages: [282,363,446,397,153,361,270,194,419,300,384,448,155,329,349,175,323,337] },
      { name: 'Green', rating: 64.2, slope: 108, yardages: [282,334,446,384,140,292,270,94,419,300,307,448,134,329,349,147,323,316] },
      { name: 'Green/Purple', rating: 61.5, slope: 101, yardages: [282,253,383,290,140,239,270,94,329,251,307,395,134,329,276,147,243,316] },
      { name: 'Purple', rating: 60.0, slope: 97, yardages: [259,253,383,290,99,239,217,75,329,251,277,395,101,229,276,126,243,205] }
    ],
    teeSource: 'https://www.golfpass.com/travel-advisor/courses/4936-purple-sage-municipal-golf-course',
    yardageSource: 'https://www.golfcourseapi.com/'
  },
  {
    name: 'Quail Hollow Golf Course', city: 'Boise',
    pars: [4,3,4,3,4,4,5,4,4,4,4,4,4,4,3,5,3,4],
    source: 'https://www.golflink.com/golf-courses/id/boise/quail-hollow-golf-club',
    tees: [
      // Rating/slope below are as originally sourced from GolfLink; GolfCourseAPI
      // independently reports Gold at 69.8/134, Blue 69.6/135, White 66.4/129, Red
      // 62/104 -- meaningfully different on Red especially. Worth a USGA NCRDB
      // cross-check before fully trusting either set of numbers.
      { name: 'Gold', rating: 70.7, slope: 129, yardages: [303,201,353,176,355,392,466,398,365,400,397,393,415,265,239,487,150,421] },
      { name: 'Blue', rating: 70.1, slope: 127, yardages: [303,201,353,176,355,392,466,398,365,400,364,368,392,269,200,487,150,421] },
      { name: 'White', rating: 67.7, slope: 125, yardages: [284,175,319,125,298,366,441,372,358,386,289,337,351,260,172,442,120,393] },
      { name: 'Red', rating: 66.1, slope: 116, yardages: [250,157,272,105,250,256,351,270,249,229,241,271,297,194,121,360,94,315] }
    ],
    teeSource: 'https://www.golflink.com/golf-courses/id/boise/quail-hollow-golf-club',
    yardageSource: 'https://www.golfcourseapi.com/'
  },
  {
    name: 'RedHawk Golf Course', city: 'Nampa',
    pars: [5,4,4,3,5,3,4,3,5,4,4,4,3,5,4,3,4,4],
    source: 'https://www.golflink.com/golf-courses/id/nampa/redhawk-golf-course',
    tees: [
      { name: 'Black', rating: 73.5, slope: 129, yardages: [496,447,461,200,492,237,417,146,608,453,476,449,159,521,291,227,401,423] },
      { name: 'Blue', rating: 69.4, slope: 127, yardages: [465,400,385,180,441,192,325,126,539,384,383,407,150,502,260,193,375,402] },
      { name: 'White', rating: 66.3, slope: 119, yardages: [423,380,346,148,414,157,295,117,464,342,353,363,134,465,253,168,336,379] },
      { name: 'Red', rating: 60.3, slope: 99, yardages: [390,236,238,104,345,115,216,91,218,227,247,255,95,343,189,85,261,241] }
    ],
    teeSource: 'https://www.golfpass.com/travel-advisor/courses/29007-redhawk-golf-course',
    yardageSource: 'https://www.golfcourseapi.com/'
  },
  {
    name: 'Ridgecrest Golf Club', city: 'Nampa',
    pars: [4,4,4,5,3,4,5,3,4,4,4,3,4,5,4,3,4,5],
    source: 'https://www.golflink.com/golf-courses/id/nampa/ridgecrest-golf-course-15416'
  },
  {
    name: 'River Birch Golf Course', city: 'Star',
    pars: [5,4,4,3,4,4,4,3,5,5,4,4,3,3,4,4,4,5],
    source: 'https://www.golfcourseapi.com/',
    tees: [
      { name: 'Black', rating: 70.9, slope: 118, yardages: [501,374,396,167,356,421,360,191,543,527,466,403,214,179,346,384,337,591] },
      { name: 'Blue', rating: 68.7, slope: 111, yardages: [471,350,374,157,347,385,347,171,504,494,443,360,188,168,319,378,313,533] },
      { name: 'White', rating: 66.4, slope: 106, yardages: [463,312,351,144,278,376,317,149,448,486,434,348,158,162,314,347,305,487] },
      { name: 'Orange', rating: 64.6, slope: 100, yardages: [437,306,318,126,271,347,285,143,440,455,368,322,128,148,266,307,297,482] },
      { name: 'Red', rating: 61.5, slope: 96, yardages: [432,246,253,122,264,337,276,130,412,378,304,281,117,103,221,260,235,432] }
    ],
    teeSource: 'https://www.golfcourseapi.com/',
    yardageSource: 'https://www.golfcourseapi.com/'
  },
  {
    name: "River's Edge Golf Club", city: 'Burley',
    pars: [5,3,4,4,3,4,3,4,5,4,5,3,4,5,4,4,3,5],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Blue', rating: 69.5, slope: 115, yardages: [530,170,394,353,185,330,161,433,485,431,513,175,403,468,406,360,173,537] },
      { name: 'White', rating: 68, slope: 112, yardages: [500,160,350,335,175,310,150,385,475,420,460,155,370,455,395,325,160,475] },
      { name: 'Red', rating: 69.7, slope: 116, yardages: [482,154,288,333,169,295,121,369,465,350,450,112,351,447,384,304,138,454] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'Scotch Pines Golf Course', city: 'Payette',
    pars: [4,5,4,3,5,4,4,3,4,4,3,5,4,5,3,4,4,4],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Blue', rating: 70.1, slope: 116, yardages: [403,512,390,200,510,430,313,182,388,345,165,505,375,508,205,437,392,345] },
      { name: 'White', rating: 68.3, slope: 110, yardages: [382,478,350,152,460,370,310,153,355,340,150,490,365,475,165,400,350,330] },
      { name: 'Yellow', rating: 65.2, slope: 105, yardages: [333,402,315,130,418,334,287,126,345,322,133,440,339,458,156,389,294,291] },
      { name: 'Silver', rating: 61.1, slope: 99, yardages: [306,341,268,88,372,280,184,91,299,208,123,391,295,372,93,333,252,208] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'Shadow Valley Golf Course', city: 'Boise',
    pars: [4,4,3,5,4,3,5,4,4,4,3,4,5,3,4,4,5,4],
    source: 'https://www.golflink.com/golf-courses/id/boise/shadow-valley-golf-course',
    tees: [
      { name: 'Blue', rating: 69.4, slope: 121, yardages: [335,290,169,557,358,139,489,345,397,369,174,412,535,138,338,353,502,401] },
      { name: 'White', rating: 67.9, slope: 117, yardages: [325,267,154,539,341,121,464,321,377,355,160,387,531,108,307,342,490,354] },
      { name: 'Yellow', rating: 64.1, slope: 105, yardages: [317,252,133,486,299,84,458,297,326,298,146,324,415,94,261,304,442,298] }
    ],
    teeSource: 'https://www.golfpass.com/travel-advisor/courses/4930-shadow-valley-golf-course',
    yardageSource: 'https://www.golfcourseapi.com/'
  },
  {
    name: 'The Club at SpurWing', city: 'Meridian',
    pars: [4,5,4,4,5,3,4,4,3,4,4,3,5,4,3,5,4,4],
    source: 'https://www.golflink.com/golf-courses/id/meridian/the-club-at-spurwing-15447',
    tees: [
      { name: 'Tour', rating: 75, slope: 136, yardages: [387,551,406,451,540,195,465,406,178,465,423,201,574,442,194,627,343,424] },
      { name: 'Tour/Club', rating: 73.2, slope: 132, yardages: [387,492,406,402,540,181,433,406,178,431,423,185,514,442,153,558,343,424] },
      { name: 'Club', rating: 72.3, slope: 131, yardages: [373,492,391,402,516,181,433,386,150,431,400,185,514,429,153,558,316,413] },
      { name: 'Club/Member', rating: 70.5, slope: 131, yardages: [373,492,391,340,452,171,388,386,150,405,349,171,514,333,153,558,316,366] },
      { name: 'Member', rating: 69, slope: 124, yardages: [346,453,348,340,452,171,388,327,121,405,349,171,469,333,135,477,276,366] },
      { name: 'Member/Forward', rating: 67.5, slope: 116, yardages: [346,453,306,326,428,171,388,327,121,361,330,121,469,278,135,477,276,355] },
      { name: 'Forward', rating: 66, slope: 113, yardages: [311,439,306,326,428,95,336,294,95,361,330,121,437,278,112,425,237,355] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'Sun Valley Resort Golf Course', city: 'Sun Valley',
    // This is the resort's main 18-hole course (Trail Creek). The resort's
    // other, shorter course (White Clouds, 9 holes) isn't in this list --
    // OpenGolfAPI has no course rating on file for it at all.
    pars: [5,4,4,3,5,3,4,4,4,3,4,4,4,4,4,5,3,5],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Middle', rating: 69.4, slope: 129, yardages: [551,342,436,130,507,101,378,276,389,162,382,360,362,358,367,501,179,522] },
      { name: 'Resort', rating: 67.7, slope: 125, yardages: [485,340,334,130,469,101,340,254,389,162,382,360,312,358,350,482,151,512] },
      { name: 'Forward', rating: 69.6, slope: 127, yardages: [427,293,291,111,399,69,305,226,349,108,347,339,312,345,332,437,128,474] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  { name: 'Teton Lakes Golf Course', city: 'Rexburg' },
  {
    name: 'TimberStone Golf Course', city: 'Caldwell',
    pars: [4,4,4,5,4,3,5,3,4,4,4,5,3,5,4,4,3,4],
    source: 'https://www.golfcourseapi.com/',
    tees: [
      { name: 'Orange', rating: 72.1, slope: 131, yardages: [391,393,384,486,326,220,513,159,428,399,339,592,216,522,393,419,187,402] },
      { name: 'White', rating: 69.9, slope: 126, yardages: [368,365,353,475,310,176,485,147,398,379,317,560,201,497,372,402,160,375] },
      { name: 'Green', rating: 67.8, slope: 122, yardages: [349,343,332,444,303,156,455,134,350,368,308,528,158,489,351,377,146,358] },
      { name: 'Gold', rating: 65.1, slope: 107, yardages: [318,315,296,414,256,106,433,121,346,333,267,469,148,436,326,348,130,300] }
    ],
    teeSource: 'https://www.golfcourseapi.com/',
    yardageSource: 'https://www.golfcourseapi.com/'
  },
  {
    // Renamed from "University of Idaho Golf Course" -- same course, current
    // branding is Vandal Golf Course (Vandals is the school's mascot).
    name: 'Vandal Golf Course', city: 'Moscow',
    pars: [4,3,4,5,3,5,5,4,4,4,4,4,5,3,4,4,3,4],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Black', rating: 72.4, slope: 136, yardages: [386,156,390,556,171,491,546,375,293,375,406,400,504,227,395,383,232,415] },
      { name: 'Gold', rating: 70.3, slope: 131, yardages: [355,139,376,526,147,473,478,334,276,302,391,377,484,202,351,365,204,382] },
      { name: 'Silver', rating: 68, slope: 124, yardages: [323,123,325,436,118,459,459,327,258,293,375,353,465,192,295,349,177,372] },
      { name: 'Bronze', rating: 68.4, slope: 120, yardages: [290,83,286,383,108,334,395,280,225,276,280,302,405,135,262,295,93,302] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: '93 Golf Ranch', city: 'Jerome',
    pars: [5,4,4,3,4,4,4,3,5,5,4,4,3,4,4,4,3,5],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Gold', rating: 73.4, slope: 123, yardages: [473,432,453,170,415,365,425,190,596,510,474,440,180,412,390,439,213,597] },
      { name: 'Blue', rating: 71.3, slope: 117, yardages: [443,414,435,154,380,325,395,170,576,493,447,410,165,400,365,428,206,580] },
      { name: 'White', rating: 68.3, slope: 113, yardages: [411,378,402,138,350,305,365,155,550,462,380,395,140,350,340,398,161,532] },
      { name: 'Red', rating: 65.2, slope: 104, yardages: [371,285,333,88,330,275,330,125,520,438,316,360,125,280,320,323,138,470] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'Blue Lakes Country Club', city: 'Twin Falls',
    pars: [4,5,4,4,4,3,4,5,3,4,4,5,4,4,3,5,3,4],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Blue', rating: 70, slope: 122, yardages: [366,512,361,402,358,201,427,556,146,336,268,513,438,387,180,477,212,459] },
      { name: 'White', rating: 67.2, slope: 115, yardages: [328,468,337,326,344,195,392,519,114,327,258,484,347,347,137,418,166,393] },
      { name: 'Red', rating: 69.3, slope: 125, yardages: [298,444,303,251,308,185,317,416,97,317,230,448,298,305,87,372,109,381] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'Canyon Springs Golf Course', city: 'Twin Falls',
    pars: [5,4,4,4,3,4,4,3,5,4,3,4,4,5,3,5,4,4],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Black', rating: 70.2, slope: 122, yardages: [532,360,368,381,176,386,458,228,543,325,174,346,431,483,177,554,460,425] },
      { name: 'Blue', rating: 68.7, slope: 115, yardages: [512,356,365,376,166,350,428,205,523,320,167,344,404,479,166,520,419,364] },
      { name: 'White', rating: 67.1, slope: 106, yardages: [492,342,351,362,122,333,401,181,458,291,143,330,388,470,157,468,409,330] },
      { name: 'Red', rating: 63.2, slope: 95, yardages: [427,310,256,281,100,307,396,124,432,235,116,277,333,413,145,413,343,264] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'Desert Canyon Golf Course', city: 'Mountain Home',
    pars: [5,4,3,4,4,3,4,4,5,4,3,4,5,3,4,4,4,4],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Black', rating: 68, slope: 109, yardages: [497,378,176,340,388,140,353,323,604,378,152,303,477,170,461,405,394,382] },
      { name: 'White', rating: 65.1, slope: 102, yardages: [464,343,158,312,350,130,353,288,558,315,152,303,451,152,372,314,311,352] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'Elkhorn Golf Club', city: 'Sun Valley',
    pars: [4,4,3,4,5,3,5,4,4,4,3,4,5,3,4,4,4,5],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Black', rating: 73.4, slope: 136, yardages: [406,349,224,423,642,170,492,421,448,383,180,426,544,200,428,367,449,537] },
      { name: 'Gold', rating: 70.8, slope: 131, yardages: [377,323,200,386,602,150,462,393,419,344,157,404,508,186,365,341,418,514] },
      { name: 'Silver', rating: 68.3, slope: 128, yardages: [343,281,173,337,553,130,446,388,386,291,135,362,466,162,336,308,375,476] },
      { name: 'Copper', rating: 64.5, slope: 117, yardages: [261,243,126,291,455,104,394,347,338,274,78,308,419,121,304,254,326,438] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    // A genuine 9-hole course -- OpenGolfAPI's only card for it repeats the
    // same 9 holes for the back 9 (see Fairview/Pierce Park Greens above).
    name: 'Gooding Golf Course', city: 'Gooding',
    pars: [4,4,4,4,3,5,4,4,3,4,4,4,4,3,5,4,4,3],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Red', rating: null, slope: 94, yardages: [301,306,273,371,122,407,317,334,131,301,306,273,371,122,407,317,334,131] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    // No course/slope rating on file for this one -- yardages still useful
    // for SG:OTT, but this tee won't contribute to score differential
    // (same as any course entered via "Other" without a rating).
    name: 'Jerome Country Club', city: 'Jerome',
    pars: [4,4,5,4,3,4,3,5,4,4,5,3,4,4,3,5,4,4],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Gold', rating: null, slope: null, yardages: [362,376,500,392,190,403,208,507,342,369,512,180,327,374,180,488,377,389] },
      { name: 'Blue', rating: null, slope: null, yardages: [342,359,458,382,150,373,150,490,342,359,501,169,321,364,165,459,368,361] },
      { name: 'Black', rating: null, slope: null, yardages: [337,353,415,375,122,360,122,441,314,307,486,144,291,356,149,459,359,354] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    // Genuine 9-hole course, repeated to 18 (see Gooding above); no rating on file.
    name: 'Pebble Ponds Golf Course', city: 'Filer',
    pars: [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Red', rating: null, slope: null, yardages: [135,70,105,70,65,80,75,80,80,135,70,105,70,65,80,75,80,80] },
      { name: 'White', rating: null, slope: null, yardages: [160,95,125,90,100,100,95,105,130,160,95,125,90,100,100,95,105,130] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    // Genuine 9-hole course, repeated to 18 (see Gooding above).
    name: 'Pleasant Valley Golf Course', city: 'Kimberly',
    pars: [4,3,5,4,4,3,3,4,3,4,3,5,4,4,3,3,4,3],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Blue', rating: null, slope: 103, yardages: [345,200,503,536,422,174,128,347,177,345,200,503,536,422,174,128,347,177] },
      { name: 'White', rating: null, slope: 101, yardages: [335,156,499,410,332,165,122,342,170,335,156,499,410,332,165,122,342,170] },
      { name: 'Red', rating: null, slope: 104, yardages: [329,120,408,361,322,153,87,260,160,329,120,408,361,322,153,87,260,160] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'River Bend Golf Course', city: 'Wilder',
    pars: [4,3,4,4,5,3,4,5,4,4,4,3,5,4,3,4,5,4],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Black', rating: 72.3, slope: 118, yardages: [435,205,291,421,609,183,481,518,372,395,359,189,509,443,187,428,480,343] },
      { name: 'Blue', rating: 69.6, slope: 113, yardages: [411,177,262,359,568,147,404,503,363,387,334,171,483,398,165,377,477,332] },
      { name: 'White', rating: 66.9, slope: 108, yardages: [399,167,245,310,513,133,377,495,354,378,317,156,459,374,144,333,452,316] },
      { name: 'Red', rating: 63.7, slope: 98, yardages: [342,149,217,283,429,118,337,435,323,327,275,127,425,335,87,255,391,276] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'Rupert Country Club', city: 'Rupert',
    pars: [5,3,4,5,3,4,4,4,4,4,3,5,3,4,5,3,4,4],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Black', rating: 69.6, slope: 121, yardages: [499,189,392,558,177,406,423,363,395,396,218,495,183,380,496,182,380,381] },
      { name: 'Blue', rating: 68.2, slope: 119, yardages: [491,167,376,537,161,391,407,354,373,381,200,477,170,362,482,162,364,366] },
      { name: 'Gold', rating: 69.2, slope: 119, yardages: [416,140,307,435,141,353,362,302,244,361,193,466,126,346,473,103,345,343] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'Silver Sage Golf Course', city: 'Mountain Home',
    pars: [5,3,4,4,4,5,4,3,4,3,4,4,4,5,5,3,4,4],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Gold', rating: 72, slope: 128, yardages: [416,101,344,326,325,409,255,131,284,158,261,342,219,406,473,122,238,246] },
      { name: 'Blue', rating: 70.5, slope: 123, yardages: [539,126,409,375,378,511,378,203,349,177,362,428,335,536,557,165,388,376] },
      { name: 'White', rating: 66.6, slope: 111, yardages: [522,119,360,368,350,474,354,178,340,169,328,394,291,491,544,162,377,372] },
      { name: 'Red', rating: 71.2, slope: 123, yardages: [418,104,349,332,345,467,316,133,287,161,312,386,283,455,476,124,325,356] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    // No rating on file for either tee.
    name: 'Twin Falls Golf Club', city: 'Twin Falls',
    pars: [4,3,3,4,4,4,4,4,4,4,3,3,4,4,4,4,4,4],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'White', rating: null, slope: null, yardages: [334,152,110,343,351,260,275,330,298,334,152,110,343,351,260,275,330,298] },
      { name: 'Red', rating: null, slope: null, yardages: [330,106,110,260,351,260,275,330,252,330,106,110,260,351,260,275,330,252] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    // OpenGolfAPI lists this as a separate 18-hole facility from Twin Falls
    // Golf Club above rather than the same course under two names -- kept
    // as its own entry rather than guessing they're the same place.
    name: 'Twin Falls Municipal Golf Course', city: 'Twin Falls',
    pars: [5,3,4,3,4,3,4,4,4,3,4,4,4,3,4,4,3,5],
    source: 'https://www.opengolfapi.org/',
    tees: [
      { name: 'Blue', rating: 65.7, slope: 105, yardages: [450,190,336,175,402,161,324,418,363,209,253,367,260,164,340,413,190,459] },
      { name: 'White', rating: 64.7, slope: 103, yardages: [442,175,351,168,382,150,316,397,353,171,246,330,252,156,328,403,186,446] },
      { name: 'Red', rating: 62.7, slope: 99, yardages: [408,160,345,151,363,139,308,376,340,154,238,279,235,144,275,392,182,432] }
    ],
    teeSource: 'https://www.opengolfapi.org/',
    yardageSource: 'https://www.opengolfapi.org/'
  },
  {
    name: 'Warm Springs Golf Course', city: 'Boise',
    pars: [4,4,4,3,4,5,4,3,5,4,4,5,3,4,5,4,4,3],
    source: 'https://www.golflink.com/golf-courses/id/boise/warm-springs-golf-club'
    // GolfCourseAPI has this course too (same total par, 72), but its
    // hole-by-hole par sequence doesn't line up with the GolfLink card
    // above -- not safe to attach its yardages hole-for-hole without
    // resolving which numbering is right. Left out until that's done by hand.
  }
];

const OTHER_COURSE_VALUE = '__other__';
const OTHER_TEE_VALUE = '__other_tee__';

/** Looks up an IDAHO_COURSES entry by its exact display name, or null. */
function findCourseByName(name) {
  return IDAHO_COURSES.find((c) => c.name === name) || null;
}
