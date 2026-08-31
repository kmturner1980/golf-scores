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
const IDAHO_COURSES = [
  {
    name: 'BanBury Golf Course', city: 'Eagle',
    pars: [4,5,3,5,3,4,4,3,4,4,4,5,4,3,4,3,4,5],
    source: 'https://www.golflink.com/golf-courses/id/eagle/banbury-golf-club',
    tees: [
      { name: 'Black', rating: 72.3, slope: 132 },
      { name: 'Blue', rating: 69.6, slope: 123 },
      { name: 'White', rating: 67.0, slope: 118 },
      { name: 'Red', rating: 64.5, slope: 111 },
      { name: 'Gold', rating: 61.5, slope: 105 }
    ],
    teeSource: 'https://www.golfnow.com/courses/1047709-banbury-golf-club-details'
  },
  {
    name: 'Boise Ranch Golf Course', city: 'Boise',
    pars: [4,3,4,3,5,4,4,3,5,5,4,3,5,4,4,3,4,4],
    source: 'https://www.golflink.com/golf-courses/id/boise/boise-ranch-golf-course-inc',
    tees: [
      { name: 'Black', rating: 70.6, slope: 125 },
      { name: 'Gold', rating: 68.2, slope: 116 },
      { name: 'Silver', rating: 66.9, slope: 113 }
    ],
    teeSource: 'https://www.golfpass.com/travel-advisor/courses/4924-boise-ranch-golf-course'
  },
  {
    name: 'Centennial Golf Course', city: 'Nampa',
    pars: [4,4,4,3,5,4,3,5,4,4,5,3,4,4,5,3,4,4],
    source: 'https://www.golflink.com/golf-courses/id/nampa/centennial-golf-course'
  },
  {
    name: 'Crane Creek Country Club', city: 'Boise',
    pars: [4,4,3,5,4,5,3,4,4,4,4,3,5,4,3,4,4,4],
    source: 'https://www.golflink.com/golf-courses/id/boise/crane-creek-country-club-3053'
  },
  { name: 'Circling Raven Golf Club', city: 'Worley' },
  { name: "Coeur d'Alene Resort Golf Course", city: "Coeur d'Alene" },
  {
    name: 'Eagle Hills Golf Course', city: 'Eagle',
    pars: [4,4,5,4,3,5,4,3,4,5,3,4,4,3,4,4,4,5],
    source: 'https://www.golflink.com/golf-courses/id/eagle/eagle-hills-golf-course'
  },
  { name: 'Fairview Golf Course', city: 'Caldwell' },
  {
    name: 'Falcon Crest Golf Club', city: 'Kuna',
    pars: [4,5,4,4,3,5,4,3,4,3,5,4,3,4,4,5,3,4],
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
      { name: 'Black', rating: 72.6, slope: 134 },
      { name: 'Black/White', rating: 71.2, slope: 135 },
      { name: 'White', rating: 69.9, slope: 131 },
      { name: 'Green', rating: 68.2, slope: 126 },
      { name: 'Green/Gold', rating: 66.9, slope: 123 }
    ],
    teeSource: 'https://www.golfpass.com/travel-advisor/courses/4926-hillcrest-country-club'
  },
  { name: 'Jug Mountain Ranch', city: 'McCall' },
  {
    name: 'Lakeview Golf Club', city: 'Meridian',
    pars: [4,4,4,3,5,4,3,4,5,4,5,4,3,5,4,4,3,4],
    source: 'https://www.golflink.com/golf-courses/id/meridian/lakeview-golf-club'
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
      { name: 'Grey', rating: 71.1, slope: 126 },
      { name: 'Copper', rating: 69.2, slope: 125 },
      { name: 'Copper/Green', rating: 66.2, slope: 114 },
      { name: 'Green', rating: 64.2, slope: 108 },
      { name: 'Green/Purple', rating: 61.5, slope: 101 },
      { name: 'Purple', rating: 60.0, slope: 97 }
    ],
    teeSource: 'https://www.golfpass.com/travel-advisor/courses/4936-purple-sage-municipal-golf-course'
  },
  {
    name: 'Quail Hollow Golf Course', city: 'Boise',
    pars: [4,3,4,3,4,4,5,4,4,4,4,4,4,4,3,5,3,4],
    source: 'https://www.golflink.com/golf-courses/id/boise/quail-hollow-golf-club',
    tees: [
      { name: 'Gold', rating: 70.7, slope: 129 },
      { name: 'Blue', rating: 70.1, slope: 127 },
      { name: 'White', rating: 67.7, slope: 125 },
      { name: 'Red', rating: 66.1, slope: 116 }
    ],
    teeSource: 'https://www.golflink.com/golf-courses/id/boise/quail-hollow-golf-club'
  },
  {
    name: 'RedHawk Golf Course', city: 'Nampa',
    pars: [5,4,4,3,5,3,4,3,5,4,4,4,3,5,4,3,4,4],
    source: 'https://www.golflink.com/golf-courses/id/nampa/redhawk-golf-course',
    tees: [
      { name: 'Black', rating: 73.5, slope: 129 },
      { name: 'Blue', rating: 69.4, slope: 127 },
      { name: 'White', rating: 66.3, slope: 119 },
      { name: 'Red', rating: 60.3, slope: 99 }
    ],
    teeSource: 'https://www.golfpass.com/travel-advisor/courses/29007-redhawk-golf-course'
  },
  {
    name: 'Ridgecrest Golf Club', city: 'Nampa',
    pars: [4,4,4,5,3,4,5,3,4,4,4,3,4,5,4,3,4,5],
    source: 'https://www.golflink.com/golf-courses/id/nampa/ridgecrest-golf-course-15416'
  },
  { name: "River's Edge Golf Club", city: 'Burley' },
  { name: 'Scotch Pines Golf Course', city: 'Payette' },
  {
    name: 'Shadow Valley Golf Course', city: 'Boise',
    pars: [4,4,3,5,4,3,5,4,4,4,3,4,5,3,4,4,5,4],
    source: 'https://www.golflink.com/golf-courses/id/boise/shadow-valley-golf-course',
    tees: [
      { name: 'Blue', rating: 69.4, slope: 121 },
      { name: 'White', rating: 67.9, slope: 117 },
      { name: 'Yellow', rating: 64.1, slope: 105 }
    ],
    teeSource: 'https://www.golfpass.com/travel-advisor/courses/4930-shadow-valley-golf-course'
  },
  {
    name: 'The Club at SpurWing', city: 'Meridian',
    pars: [4,5,4,4,5,3,4,4,3,4,4,3,5,4,3,5,4,4],
    source: 'https://www.golflink.com/golf-courses/id/meridian/the-club-at-spurwing-15447'
  },
  { name: 'Sun Valley Resort Golf Course', city: 'Sun Valley' },
  { name: 'Teton Lakes Golf Course', city: 'Rexburg' },
  { name: 'TimberStone Golf Course', city: 'Caldwell' },
  { name: 'University of Idaho Golf Course', city: 'Moscow' },
  {
    name: 'Warm Springs Golf Course', city: 'Boise',
    pars: [4,4,4,3,4,5,4,3,5,4,4,5,3,4,5,4,4,3],
    source: 'https://www.golflink.com/golf-courses/id/boise/warm-springs-golf-club'
  }
];

const OTHER_COURSE_VALUE = '__other__';
const OTHER_TEE_VALUE = '__other_tee__';
