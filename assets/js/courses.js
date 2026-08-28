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
const IDAHO_COURSES = [
  {
    name: 'BanBury Golf Course', city: 'Eagle',
    pars: [4,5,3,5,3,4,4,3,4,4,4,5,4,3,4,3,4,5],
    source: 'https://www.golflink.com/golf-courses/id/eagle/banbury-golf-club'
  },
  {
    name: 'Boise Ranch Golf Course', city: 'Boise',
    pars: [4,3,4,3,5,4,4,3,5,5,4,3,5,4,4,3,4,4],
    source: 'https://www.golflink.com/golf-courses/id/boise/boise-ranch-golf-course-inc'
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
    source: 'https://www.golflink.com/golf-courses/id/kuna/falcon-crest-golf-club-15751'
  },
  {
    name: 'Hillcrest Country Club', city: 'Boise',
    pars: [4,5,5,3,4,4,4,3,4,4,4,4,3,4,4,5,3,4],
    source: 'https://www.golflink.com/golf-courses/id/boise/hillcrest-country-club-inc'
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
    source: 'https://www.golflink.com/golf-courses/id/caldwell/purple-sage-golf-course'
  },
  {
    name: 'Quail Hollow Golf Course', city: 'Boise',
    pars: [4,3,4,3,4,4,5,4,4,4,4,4,4,4,3,5,3,4],
    source: 'https://www.golflink.com/golf-courses/id/boise/quail-hollow-golf-club'
  },
  {
    name: 'RedHawk Golf Course', city: 'Nampa',
    pars: [5,4,4,3,5,3,4,3,5,4,4,4,3,5,4,3,4,4],
    source: 'https://www.golflink.com/golf-courses/id/nampa/redhawk-golf-course'
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
    source: 'https://www.golflink.com/golf-courses/id/boise/shadow-valley-golf-course'
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
