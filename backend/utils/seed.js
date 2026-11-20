require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { Place } = require('../models/Place');
const Review = require('../models/Review');
const { Report } = require('../models/Report');
const connectDB = require('../config/db');

const samplePlaces = [
  {
    name: 'Metro Central Memorial Hospital',
    description: 'Premier regional acute-care medical center with 24/7 emergency services, specialized rehabilitation pavilions, and comprehensive patient care. Designed from the ground up for maximum accessibility with wide automated corridors, flat thresholds, and dedicated mobility assistance escorts at every main reception point.',
    category: 'Healthcare',
    address: '450 East 29th Street, Medical District',
    city: 'New York',
    contactPhone: '+1 (212) 555-0144',
    contactEmail: 'accessibility@metrocentralhospital.org',
    website: 'https://metrocentralhospital.example.org',
    openingHours: 'Open 24 hours / 7 days a week',
    wheelchairAccessible: true,
    rampAvailable: true,
    accessibleWashroom: true,
    elevatorAvailable: true,
    accessibleParking: true,
    additionalAccessibility: 'Features automated push-button double doors, wheelchair-height triage desks, braille and high-contrast tactile floor signage throughout, tactile paving leading from transit stop, and 12 designated ADA parking spaces with van clearance right outside the emergency entrance.',
    photos: [
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    name: 'Pacific Heights Medical & Rehabilitation Center',
    description: 'Specialized physical therapy, occupational health, and wellness clinic offering state-of-the-art mobility therapy and accessible outpatient care in northern California. Fully adapted facilities with zero-step entry and ceiling-mounted patient transfer hoists in examination rooms.',
    category: 'Healthcare',
    address: '2200 Webster Street, Suite 400',
    city: 'San Francisco',
    contactPhone: '+1 (415) 555-0182',
    contactEmail: 'care@pacificheightsrehab.example.com',
    website: 'https://pacificheightsrehab.example.com',
    openingHours: 'Mon-Fri: 7:00 AM - 7:00 PM, Sat: 8:00 AM - 2:00 PM',
    wheelchairAccessible: true,
    rampAvailable: true,
    accessibleWashroom: true,
    elevatorAvailable: true,
    accessibleParking: true,
    additionalAccessibility: 'Level surface underground parking garage with oversized elevator direct to clinic reception. Power-assisted entrance doors, wheelchair loan stations in lobby, and gender-neutral spacious accessible restrooms on every floor.',
    photos: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    name: 'Sunrise Inclusive Bakery & Artisan Cafe',
    description: 'Warm and inviting community cafe serving specialty fair-trade coffees, artisan sourdough breads, and allergy-friendly pastries. Purpose-built with inclusive design in mind, ensuring wheelchair users and service animal teams have full mobility across the dining area.',
    category: 'Restaurant & Cafe',
    address: '742 North Michigan Avenue',
    city: 'Chicago',
    contactPhone: '+1 (312) 555-0199',
    contactEmail: 'hello@sunrisecafe-chicago.example.com',
    website: 'https://sunrisecafe.example.com',
    openingHours: 'Mon-Sun: 6:30 AM - 8:00 PM',
    wheelchairAccessible: true,
    rampAvailable: true,
    accessibleWashroom: true,
    elevatorAvailable: false,
    accessibleParking: true,
    additionalAccessibility: 'Grade-level street entrance with zero steps. 36-inch wide walkways between sturdy non-bolted tables. Large-print and Braille menus available on demand, sensory-calm seating alcove with low music, and water bowls for certified service dogs.',
    photos: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    name: 'Harbor View Seafood & Oyster Bistro',
    description: 'Waterfront dining destination overlooking the Puget Sound, offering sustainably sourced Pacific seafood and stunning bay views. Features outdoor patio and indoor dining rooms with gentle sloped walkways.',
    category: 'Restaurant & Cafe',
    address: '1301 Alaskan Way, Pier 56',
    city: 'Seattle',
    contactPhone: '+1 (206) 555-0133',
    contactEmail: 'reservations@harborviewseafood.example.com',
    website: 'https://harborviewseafood.example.com',
    openingHours: 'Daily: 11:30 AM - 10:00 PM',
    wheelchairAccessible: true,
    rampAvailable: true,
    accessibleWashroom: true,
    elevatorAvailable: false,
    accessibleParking: false,
    additionalAccessibility: 'Side entrance ramp with ADA-compliant 1:12 slope and sturdy dual handrails. Pier parking nearby with public accessible spaces, though street parking directly in front is limited. Unisex accessible restroom with emergency pull-cord.',
    photos: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    name: 'Grand Central Public Library & Learning Center',
    description: 'Historic municipal library holding over 500,000 volumes, state-of-the-art digital research facilities, public meeting halls, and a dedicated assistive technology media lab. Thoroughly modernized to ensure universal access for all community members.',
    category: 'Education & Library',
    address: '476 5th Avenue, Midtown',
    city: 'New York',
    contactPhone: '+1 (212) 555-0120',
    contactEmail: 'access@grandcentrallibrary.example.org',
    website: 'https://grandcentrallibrary.example.org',
    openingHours: 'Mon-Thu: 9:00 AM - 8:00 PM, Fri-Sat: 9:00 AM - 6:00 PM, Sun: 1:00 PM - 5:00 PM',
    wheelchairAccessible: true,
    rampAvailable: true,
    accessibleWashroom: true,
    elevatorAvailable: true,
    accessibleParking: true,
    additionalAccessibility: 'South entrance features a gentle sloping covered ramp and automatic sliding glass doors. Three oversized glass elevators connect all four library tiers. Equipped with screen magnification stations, Braille translation software, hearing induction loop at check-out desks, and motorized adjustable study desks.',
    photos: [
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    name: 'Bay Area Science & Innovation Institute',
    description: 'Premier educational science campus and interactive exhibition space featuring hands-on STEM laboratories, auditorium lectures, and universal technology programs for students and educators.',
    category: 'Education & Library',
    address: '600 Townsend Street',
    city: 'San Francisco',
    contactPhone: '+1 (415) 555-0165',
    contactEmail: 'contact@basci-institute.example.org',
    website: 'https://basci-institute.example.org',
    openingHours: 'Tue-Sun: 9:30 AM - 5:30 PM',
    wheelchairAccessible: true,
    rampAvailable: true,
    accessibleWashroom: true,
    elevatorAvailable: true,
    accessibleParking: true,
    additionalAccessibility: 'Tiered auditorium features reserved front-row and middle-row wheelchair bays with companion seating. Assistive listening headsets available at reception. Tactile exhibit models with audio descriptions.',
    photos: [
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    name: 'Riverside Botanical Gardens & Inclusive Trail',
    description: 'A 60-acre municipal sanctuary along the Colorado River featuring native flora, tranquil water gardens, and a certified all-abilities paved nature trail designed for wheelchair users, walkers, and strollers.',
    category: 'Park & Recreation',
    address: '2201 Barton Springs Road',
    city: 'Austin',
    contactPhone: '+1 (512) 555-0177',
    contactEmail: 'info@riversidegardens-austin.example.gov',
    website: 'https://riversidegardens.example.gov',
    openingHours: 'Daily: 7:00 AM - 8:30 PM',
    wheelchairAccessible: true,
    rampAvailable: true,
    accessibleWashroom: true,
    elevatorAvailable: false,
    accessibleParking: true,
    additionalAccessibility: '2.5 miles of smooth, non-slip porous concrete trails with max 4% grade. Sensory garden with tactile plants and aromatic herbs at touch height. Wheelchair-accessible picnic tables with clear knee clearance. 8 designated ADA parking spaces near visitor pavilion.',
    photos: [
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    name: 'Lincoln Park Inclusive Promenade & Playground',
    description: 'Iconic public park featuring an all-abilities universal playground, smooth paved lakefront walkways, shaded rest pavilions, and fully adapted recreational amenities.',
    category: 'Park & Recreation',
    address: '2045 North Lincoln Park West',
    city: 'Chicago',
    contactPhone: '+1 (312) 555-0155',
    contactEmail: 'parks@chicagoparks.example.gov',
    website: 'https://chicagoparks.example.gov/lincolnpark',
    openingHours: 'Daily: 6:00 AM - 11:00 PM',
    wheelchairAccessible: true,
    rampAvailable: true,
    accessibleWashroom: true,
    elevatorAvailable: false,
    accessibleParking: true,
    additionalAccessibility: 'Playground features unitary poured-in-place rubber safety surfacing (no wood chips), adaptive molded bucket swings with harness, wheelchair-accessible carousel, and braille perimeter trail maps. Restrooms include adult-sized changing tables.',
    photos: [
      'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    name: 'City Center Grand Galleria',
    description: 'Expansive modern shopping destination featuring four retail levels, 140+ shops, a gourmet international food hall, and entertainment complex, designed to meet top accessibility standards.',
    category: 'Shopping & Mall',
    address: '1000 6th Avenue',
    city: 'New York',
    contactPhone: '+1 (212) 555-0111',
    contactEmail: 'guestservices@grandgalleria.example.com',
    website: 'https://grandgalleria.example.com',
    openingHours: 'Mon-Sat: 10:00 AM - 9:30 PM, Sun: 11:00 AM - 7:00 PM',
    wheelchairAccessible: true,
    rampAvailable: true,
    accessibleWashroom: true,
    elevatorAvailable: true,
    accessibleParking: true,
    additionalAccessibility: 'Equipped with 8 high-speed, voice-announced elevators with braille buttons and low interior handrails. Free motorized mobility scooter and wheelchair loans at guest services. Sensory retreat lounge for neurodivergent visitors with subdued lighting.',
    photos: [
      'https://images.unsplash.com/photo-1567449303183-ae0d6ed1498e?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    name: 'Westfield Waterfront Center',
    description: 'Premier open-air retail and dining center with sweeping harbor views, level wide pedestrian avenues, and convenient accessible valet parking.',
    category: 'Shopping & Mall',
    address: '865 Market Street',
    city: 'San Francisco',
    contactPhone: '+1 (415) 555-0130',
    contactEmail: 'concierge@westfieldwaterfront.example.com',
    website: 'https://westfieldwaterfront.example.com',
    openingHours: 'Mon-Sat: 10:00 AM - 9:00 PM, Sun: 11:00 AM - 6:00 PM',
    wheelchairAccessible: true,
    rampAvailable: true,
    accessibleWashroom: true,
    elevatorAvailable: true,
    accessibleParking: true,
    additionalAccessibility: 'Curbside passenger drop-off zones with curb cuts, touchless restroom doors, low service counters throughout food hall, and tactile guidance pavers on pedestrian crossings.',
    photos: [
      'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    name: 'Union Central Metro & Rail Hub',
    description: 'Key multimodal transit center integrating intercity rail, metropolitan subway, and city bus fleets under one roof with barrier-free navigation for passengers with disabilities.',
    category: 'Transit & Station',
    address: '225 South Canal Street',
    city: 'Chicago',
    contactPhone: '+1 (312) 555-0170',
    contactEmail: 'accessibility@unioncentralhub.example.org',
    website: 'https://unioncentraltransit.example.org',
    openingHours: 'Open 24 hours / 7 days a week',
    wheelchairAccessible: true,
    rampAvailable: true,
    accessibleWashroom: true,
    elevatorAvailable: true,
    accessibleParking: true,
    additionalAccessibility: 'Dual redundancy elevator access to every platform level, tactile warning strips on all platform edges, audible train arrival and departure announcements, low-counter ticket booths, and trained transit ambassadors available 24/7.',
    photos: [
      'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    name: 'Metropolitan Museum of Contemporary Art',
    description: 'World-renowned art museum displaying modern masterworks and rotating international installations. Fully accessible galleries, educational workshops, and inclusive audio-described guide services.',
    category: 'Museum & Culture',
    address: '11 West 53 Street',
    city: 'New York',
    contactPhone: '+1 (212) 555-0150',
    contactEmail: 'accessprograms@metmodernart.example.org',
    website: 'https://metmodernart.example.org',
    openingHours: 'Sun-Fri: 10:30 AM - 5:30 PM, Sat: 10:30 AM - 7:00 PM',
    wheelchairAccessible: true,
    rampAvailable: true,
    accessibleWashroom: true,
    elevatorAvailable: true,
    accessibleParking: true,
    additionalAccessibility: 'Zero-step museum entrance on 53rd Street. Free manual wheelchairs loaned on a first-come basis. High-contrast tactile 3D reproductions of featured paintings for blind and low-vision patrons, and ASL interpreted tours on select Saturdays.',
    photos: [
      'https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=80'
    ]
  },
  {
    name: 'Historic Old Town Heritage Bookstore',
    description: 'Charming historic bookstore and rare manuscripts archive housed in an 1890 brick building. Features cozy reading nooks, author readings, and historical documents.',
    category: 'Education & Library',
    address: '142 Congress Avenue',
    city: 'Austin',
    contactPhone: '+1 (512) 555-0190',
    contactEmail: 'books@oldtownheritage.example.com',
    website: 'https://oldtownheritagebooks.example.com',
    openingHours: 'Mon-Sat: 10:00 AM - 7:00 PM',
    wheelchairAccessible: false,
    rampAvailable: false,
    accessibleWashroom: false,
    elevatorAvailable: false,
    accessibleParking: false,
    additionalAccessibility: 'Historic landmark building has 3 steps at front threshold with no permanent ramp currently installed. Narrow interior aisles. (Great candidate for community accessibility improvement report!)',
    photos: [
      'https://images.unsplash.com/photo-1507842229452-7132a26569eb?auto=format&fit=crop&w=1000&q=80'
    ]
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting Accessible Place Finder Database Seeding...');
    await connectDB();

    // 1. Clean existing records safely
    console.log('🧹 Clearing old collections...');
    await Promise.all([
      User.deleteMany({}),
      Place.deleteMany({}),
      Review.deleteMany({}),
      Report.deleteMany({})
    ]);

    // 2. Create Administrator Account
    console.log('👤 Creating default Administrator...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@accessibleplacefinder.org',
      password: 'Admin@12345',
      role: 'admin',
      accessibilityPreferences: ['wheelchair', 'ramps', 'accessible-washroom', 'elevators']
    });

    // 3. Create Regular Community Users
    console.log('👥 Creating community users...');
    const userSarah = await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      password: 'User@12345',
      role: 'user',
      accessibilityPreferences: ['wheelchair', 'ramps', 'accessible-parking', 'accessible-washroom']
    });

    const userDavid = await User.create({
      name: 'David Miller',
      email: 'david.miller@example.com',
      password: 'User@12345',
      role: 'user',
      accessibilityPreferences: ['elevators', 'step-free', 'hearing-loop']
    });

    // 4. Create Places
    console.log(`📍 Inserting ${samplePlaces.length} sample accessible places...`);
    const createdPlaces = [];
    for (const placeData of samplePlaces) {
      const place = await Place.create({
        ...placeData,
        createdBy: adminUser._id
      });
      createdPlaces.push(place);
    }

    // 5. Create Reviews and Calculate Ratings
    console.log('⭐ Creating verified reviews...');
    const reviewsData = [
      {
        place: createdPlaces[0]._id, // Metro Hospital
        user: userSarah._id,
        rating: 5,
        comment: 'Outstanding accessibility throughout! As a power wheelchair user, the push-button automatic double doors and wide exam rooms made my appointment seamless. The staff were exceptionally courteous and respectful.',
        facilityFeedback: {
          wheelchairAccessible: true,
          rampAvailable: true,
          accessibleWashroom: true,
          elevatorAvailable: true,
          accessibleParking: true
        }
      },
      {
        place: createdPlaces[0]._id, // Metro Hospital
        user: userDavid._id,
        rating: 5,
        comment: 'The tactile paving leading from the transit entrance and the tactile braille buttons in the elevator are very well maintained. Extremely easy to navigate for patients and caregivers alike.',
        facilityFeedback: {
          wheelchairAccessible: true,
          elevatorAvailable: true,
          accessibleWashroom: true
        }
      },
      {
        place: createdPlaces[2]._id, // Sunrise Cafe
        user: userSarah._id,
        rating: 5,
        comment: 'Best accessible cafe in Chicago! Zero steps at the front door, wide aisles between tables so I didn’t feel crowded, and the staff brought over a braille menu immediately. Coffee and sourdough were incredible!',
        facilityFeedback: {
          wheelchairAccessible: true,
          accessibleWashroom: true,
          rampAvailable: true
        }
      },
      {
        place: createdPlaces[4]._id, // Library
        user: userDavid._id,
        rating: 4,
        comment: 'The glass elevators are quiet, fast, and spacious. The height-adjustable computer desks on the 2nd floor are fantastic. Only giving 4 stars because one accessible stall door latch was loose, but it was fixed quickly.',
        facilityFeedback: {
          wheelchairAccessible: true,
          elevatorAvailable: true,
          accessibleWashroom: true
        }
      },
      {
        place: createdPlaces[6]._id, // Riverside Gardens
        user: userSarah._id,
        rating: 5,
        comment: 'A true breath of fresh air! All trails are paved concrete with gentle grades. The sensory botanical garden has raised flower beds at perfect wheelchair height. Highly recommend!',
        facilityFeedback: {
          wheelchairAccessible: true,
          accessibleParking: true,
          accessibleWashroom: true
        }
      },
      {
        place: createdPlaces[11]._id, // Modern Art Museum
        user: userDavid._id,
        rating: 5,
        comment: 'Incredible experience. The 3D tactile art models with audio narration allowed my friend who is visually impaired to enjoy the contemporary exhibitions to the fullest.',
        facilityFeedback: {
          wheelchairAccessible: true,
          elevatorAvailable: true,
          accessibleWashroom: true
        }
      },
      {
        place: createdPlaces[12]._id, // Heritage Bookstore
        user: userSarah._id,
        rating: 2,
        comment: 'Lovely historic book collection, but completely inaccessible for wheelchair users due to 3 steps at the entrance with no ramp or lift. The aisles are also too narrow for mobility devices.',
        facilityFeedback: {
          wheelchairAccessible: false,
          rampAvailable: false,
          accessibleWashroom: false
        }
      }
    ];

    for (const rev of reviewsData) {
      await Review.create(rev);
    }

    // 6. Recalculate place ratings
    console.log('🔄 Recalculating average ratings and review counts...');
    for (const place of createdPlaces) {
      await Review.recalculatePlaceRating(place._id);
    }

    // 7. Create Sample Reports
    console.log('📝 Creating sample accessibility inaccuracy reports...');
    await Report.create({
      place: createdPlaces[12]._id, // Heritage Bookstore
      user: userSarah._id,
      reporterName: 'Sarah Jenkins',
      reporterEmail: 'sarah.jenkins@example.com',
      issueType: 'Facility Missing',
      facilityAffected: 'Ramp',
      description: 'The front entrance has 3 brick steps with no ramp available. Wheelchair users cannot enter the bookstore independently. Suggesting a portable or modular ADA ramp.',
      status: 'pending'
    });

    await Report.create({
      place: createdPlaces[3]._id, // Harbor View Seafood
      user: null,
      reporterName: 'Mark Robertson',
      reporterEmail: 'mark.robertson@example.com',
      issueType: 'Facility Broken / Inoperable',
      facilityAffected: 'Washroom',
      description: 'The automated door push button for the accessible washroom was stuck and failed to open the door automatically during our visit yesterday.',
      status: 'investigating',
      adminNotes: 'Contacted restaurant manager on 15 Nov; technician dispatched to repair push button mechanism.'
    });

    await Report.create({
      place: createdPlaces[6]._id, // Riverside Gardens
      user: userDavid._id,
      reporterName: 'David Miller',
      reporterEmail: 'david.miller@example.com',
      issueType: 'Incorrect Address / Hours',
      facilityAffected: 'Hours/Contact',
      description: 'The visitor center closes at 7:30 PM in the autumn season rather than 8:30 PM.',
      status: 'resolved',
      adminNotes: 'Verified seasonal hours with Austin Parks Department and updated place schedule.',
      resolvedBy: adminUser._id,
      resolvedAt: new Date()
    });

    console.log('\n==========================================');
    console.log('🎉 Seed Data Completed Successfully!');
    console.log('==========================================');
    console.log('👤 Admin Credentials:');
    console.log('   Email:    admin@accessibleplacefinder.org');
    console.log('   Password: Admin@12345');
    console.log('   Role:     admin');
    console.log('\n👥 Regular User Credentials:');
    console.log('   Email:    sarah.jenkins@example.com');
    console.log('   Password: User@12345');
    console.log('   Role:     user');
    console.log('==========================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
