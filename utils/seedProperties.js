// utils/seedProperties.js — Seed realistic South India property data
// Run: node utils/seedProperties.js
require('dotenv').config();
const { sql, query, getPool, initializeSchema } = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// ── Demo owner accounts ────────────────────────────────────────────────────
const OWNERS = [
  { name: 'Rajesh Reddy',      email: 'rajesh.owner@rentlux.com',   city: 'Hyderabad' },
  { name: 'Priya Nair',        email: 'priya.owner@rentlux.com',    city: 'Kochi' },
  { name: 'Suresh Kumar',      email: 'suresh.owner@rentlux.com',   city: 'Bengaluru' },
  { name: 'Anitha Rajan',      email: 'anitha.owner@rentlux.com',   city: 'Chennai' },
  { name: 'Venkat Rao',        email: 'venkat.owner@rentlux.com',   city: 'Visakhapatnam' },
  { name: 'Lakshmi Devi',      email: 'lakshmi.owner@rentlux.com',  city: 'Thiruvananthapuram' },
  { name: 'Mahesh Gowda',      email: 'mahesh.owner@rentlux.com',   city: 'Mysuru' },
  { name: 'Deepa Krishnan',    email: 'deepa.owner@rentlux.com',    city: 'Coimbatore' },
];

// ── Realistic South India properties ──────────────────────────────────────
function makeProperties(ownerIds) {
  const props = [];

  // ── HYDERABAD (Telangana) ─────────────────────────────────────────────
  const hyd = ownerIds[0];
  const hydProps = [
    { title: '3 BHK Furnished Apartment — Banjara Hills', city: 'Hyderabad', location: 'Road No. 12, Banjara Hills', price: 32000, bhk: 3, type: 'Apartment', description: 'Luxurious 3 BHK fully furnished apartment in the heart of Banjara Hills. Modular kitchen, wooden flooring, large balcony with city views. Gated community with 24/7 security, power backup, gym and covered parking.' },
    { title: '2 BHK Semi-Furnished Flat — Madhapur', city: 'Hyderabad', location: 'Madhapur, HITEC City', price: 22000, bhk: 2, type: 'Apartment', description: 'Well-maintained 2 BHK flat near HITEC City. Ideal for IT professionals. Close to Cyber Towers, malls and metro. Semi-furnished with wardrobes and AC.' },
    { title: '1 BHK Studio — Kukatpally', city: 'Hyderabad', location: 'KPHB Colony, Kukatpally', price: 9500, bhk: 1, type: 'Apartment', description: 'Compact 1 BHK studio apartment, perfect for bachelors and working professionals. Near Kukatpally metro station, shopping complex and hospitals.' },
    { title: '4 BHK Independent Villa — Jubilee Hills', city: 'Hyderabad', location: 'Jubilee Hills, Road No. 36', price: 75000, bhk: 4, type: 'Villa', description: 'Stunning 4 BHK independent villa with private garden, home theatre, modular kitchen and 3 car parking. Prime location in Jubilee Hills.' },
    { title: 'Premium Office Space — Gachibowli', city: 'Hyderabad', location: 'DLF Cyber City, Gachibowli', price: 95000, bhk: null, type: 'Office', description: '3,500 sqft Grade-A office space in DLF Cyber City. Glass facade, 24/7 access, ample parking, cafeteria and conference rooms. Ready for immediate occupation.' },
    { title: '2 BHK Apartment — Kondapur', city: 'Hyderabad', location: 'Kondapur, Near Biodiversity Junction', price: 18500, bhk: 2, type: 'Apartment', description: 'Spacious 2 BHK flat in Kondapur, close to IT corridor. Semi-furnished with modular kitchen. Society with lift, security and power backup.' },
    { title: '3 BHK Row House — Miyapur', city: 'Hyderabad', location: 'Miyapur, Allwyn Colony', price: 26000, bhk: 3, type: 'House', description: 'Well-ventilated 3 BHK row house with terrace access. Independent ground floor, car parking, and garden. Quiet residential area with good connectivity.' },
    { title: 'Retail Shop — Ameerpet', city: 'Hyderabad', location: 'S.R. Nagar, Ameerpet', price: 35000, bhk: null, type: 'Shop', description: '850 sqft ground floor retail shop on main road in Ameerpet. High footfall area, ideal for coaching institutes, restaurants or medical shops. 24/7 electricity.' },
  ];
  hydProps.forEach(p => props.push({ ...p, owner_id: hyd }));

  // ── WARANGAL (Telangana) ──────────────────────────────────────────────
  props.push({ title: '2 BHK Flat — Hanamkonda', city: 'Warangal', location: 'Hanamkonda, Warangal', price: 9000, bhk: 2, type: 'Apartment', description: '2 BHK flat in Hanamkonda, Warangal. Good ventilation, 24/7 water supply. Close to bus stand, markets and hospitals. Ideal for families.', owner_id: hyd });
  props.push({ title: '3 BHK House — Warangal Urban', city: 'Warangal', location: 'Warangal Urban', price: 12000, bhk: 3, type: 'House', description: 'Spacious 3 BHK independent house with garden. Family-friendly neighbourhood with excellent schools and hospitals nearby.', owner_id: hyd });

  // ── BENGALURU (Karnataka) ─────────────────────────────────────────────
  const blr = ownerIds[2];
  const blrProps = [
    { title: '2 BHK Fully Furnished — Indiranagar', city: 'Bengaluru', location: '12th Main Road, Indiranagar', price: 35000, bhk: 2, type: 'Apartment', description: 'Upscale 2 BHK fully furnished apartment in Indiranagar. Modular kitchen, premium fittings, high-speed internet, 24/7 security. Walking distance to restaurants, pubs and metro.' },
    { title: '3 BHK Semifurnished — Whitefield', city: 'Bengaluru', location: 'EPIP Zone, Whitefield', price: 28000, bhk: 3, type: 'Apartment', description: '3 BHK apartment in Whitefield IT corridor. Lift, parking, gym, clubhouse. Ideal for techies working at EPIP Zone or ITPL.' },
    { title: '1 BHK — Koramangala', city: 'Bengaluru', location: '5th Block, Koramangala', price: 18000, bhk: 1, type: 'Apartment', description: 'Cozy 1 BHK in Koramangala startup hub. Fully furnished, WiFi, gym access. Walking distance to Forum Mall, restaurants and cafes.' },
    { title: 'Premium 4 BHK Villa — HSR Layout', city: 'Bengaluru', location: 'Sector-2, HSR Layout', price: 90000, bhk: 4, type: 'Villa', description: 'Palatial 4 BHK villa in HSR Layout with private terrace, home office room, 2-car garage and landscaped garden. A signature living experience.' },
    { title: '2 BHK Apartment — Electronic City', city: 'Bengaluru', location: 'Phase-1, Electronic City', price: 15000, bhk: 2, type: 'Apartment', description: '2 BHK apartment near Electronic City tech park. Society with lift, security, CCTV, gym and tennis court. Good metro connectivity.' },
    { title: 'Co-working Office Space — MG Road', city: 'Bengaluru', location: 'MG Road, Bengaluru', price: 120000, bhk: null, type: 'Office', description: '5,000 sqft premium co-working office on iconic MG Road. Fully fitted, broadband, pantry, meeting rooms. Open floor plan suitable for 50+ employees.' },
    { title: '3 BHK — Hebbal', city: 'Bengaluru', location: 'Hebbal, North Bengaluru', price: 32000, bhk: 3, type: 'Apartment', description: 'Spacious 3 BHK in Hebbal flying junction area. Easy airport access, premium society with pool and gym. Semi-furnished.' },
  ];
  blrProps.forEach(p => props.push({ ...p, owner_id: blr }));

  // ── MYSURU (Karnataka) ─────────────────────────────────────────────────
  const mys = ownerIds[6];
  props.push({ title: '3 BHK Heritage House — VV Mohalla', city: 'Mysuru', location: 'VV Mohalla, Mysuru', price: 16000, bhk: 3, type: 'House', description: 'Beautiful 3 BHK house near Mysuru Palace road. Spacious rooms, traditional architecture, quiet neighbourhood. Ideal for family stay.', owner_id: mys });
  props.push({ title: '2 BHK Apartment — Vijayanagar', city: 'Mysuru', location: 'Vijayanagar, Mysuru', price: 10500, bhk: 2, type: 'Apartment', description: 'Neat 2 BHK apartment in Vijayanagar, Mysuru. Lift, 24/7 water, power backup. Close to schools, markets and hospitals.', owner_id: mys });
  props.push({ title: 'Commercial Shop — Devaraja Market', city: 'Mysuru', location: 'Devaraja Market, Mysuru', price: 22000, bhk: null, type: 'Shop', description: '500 sqft commercial shop in Devaraja market area. High footfall, suitable for textile, jewellery or F&B outlets.', owner_id: mys });

  // ── HUBLI (Karnataka) ──────────────────────────────────────────────────
  props.push({ title: '3 BHK House — Vidyanagar, Hubli', city: 'Hubli', location: 'Vidyanagar, Hubli', price: 11000, bhk: 3, type: 'House', description: 'Spacious 3 BHK independent house in Vidyanagar, Hubli. Ground floor, car parking, garden, terrace access. Peaceful residential area.', owner_id: mys });

  // ── CHENNAI (Tamil Nadu) ──────────────────────────────────────────────
  const chn = ownerIds[3];
  const chnProps = [
    { title: '3 BHK Luxury Apartment — Adyar', city: 'Chennai', location: 'Adyar, Chennai', price: 38000, bhk: 3, type: 'Apartment', description: 'Premium 3 BHK in Adyar. Sea breeze access, modern amenities, covered parking, 24/7 security. Walking distance to Adyar river and beach.' },
    { title: '2 BHK Semi-Furnished — Anna Nagar', city: 'Chennai', location: 'Anna Nagar East, Chennai', price: 24000, bhk: 2, type: 'Apartment', description: 'Well-maintained 2 BHK in prime Anna Nagar. Lift, clubhouse, parking. Close to shopping malls, schools and metro.' },
    { title: '1 BHK — Velachery', city: 'Chennai', location: 'Velachery, Near MRTS', price: 11000, bhk: 1, type: 'Apartment', description: 'Affordable 1 BHK flat near Velachery MRTS. Suitable for IT professionals at Guindy and Perungudi. Lift, 24/7 water supply.' },
    { title: 'IT Office Park — OMR Road', city: 'Chennai', location: 'Sholinganallur, OMR', price: 85000, bhk: null, type: 'Office', description: '4,000 sqft plug-and-play office on OMR. Glass facade, 100 Mbps internet, dedicated parking, cafeteria. Walk to Infosys, Wipro campuses.' },
    { title: '4 BHK Villa — Nungambakkam', city: 'Chennai', location: 'Nungambakkam, Chennai', price: 100000, bhk: 4, type: 'Villa', description: 'Exclusive 4 BHK villa in Nungambakkam with private pool, home theatre and 3-car garage. 5-star living in Chennai\'s most prestigious locality.' },
    { title: '2 BHK — Porur', city: 'Chennai', location: 'Porur, Chennai', price: 16000, bhk: 2, type: 'Apartment', description: 'Budget-friendly 2 BHK flat in Porur close to IT parks. Society amenities include gym, pool and kids play area.', },
  ];
  chnProps.forEach(p => props.push({ ...p, owner_id: chn }));

  // ── COIMBATORE (Tamil Nadu) ────────────────────────────────────────────
  const cbe = ownerIds[7];
  props.push({ title: '3 BHK Villa — RS Puram', city: 'Coimbatore', location: 'RS Puram, Coimbatore', price: 22000, bhk: 3, type: 'Villa', description: '3 BHK independent villa in prime RS Puram locality. Garden, parking, wooden flooring, peaceful environment.', owner_id: cbe });
  props.push({ title: '2 BHK Apartment — Peelamedu', city: 'Coimbatore', location: 'Peelamedu, Coimbatore', price: 12000, bhk: 2, type: 'Apartment', description: '2 BHK flat near Peelamedu, close to PSG and Codissia. Lift, parking, power backup. Ideal for working professionals.', owner_id: cbe });
  props.push({ title: 'Textile Showroom — Gandhipuram', city: 'Coimbatore', location: 'Gandhipuram, Coimbatore', price: 42000, bhk: null, type: 'Shop', description: '1,200 sqft ground floor commercial space in Gandhipuram. High footfall area. Suitable for textile, electronics or jewellery business.', owner_id: cbe });

  // ── MADURAI (Tamil Nadu) ──────────────────────────────────────────────
  props.push({ title: '3 BHK House — Anna Nagar Madurai', city: 'Madurai', location: 'Anna Nagar, Madurai', price: 14000, bhk: 3, type: 'House', description: 'Spacious 3 BHK independent house in Anna Nagar, Madurai. Car parking, terrace, garden. Close to Meenakshi Amman Temple and shopping areas.', owner_id: chn });
  props.push({ title: '2 BHK Apartment — Bypass Road', city: 'Madurai', location: 'Bypass Road, Madurai', price: 9500, bhk: 2, type: 'Apartment', description: 'Affordable 2 BHK flat near Madurai Bypass. Lift, 24/7 water, security. Suitable for young families and professionals.', owner_id: chn });

  // ── KOCHI (Kerala) ────────────────────────────────────────────────────
  const koc = ownerIds[1];
  const kocProps = [
    { title: '3 BHK Luxury Flat — Marine Drive', city: 'Kochi', location: 'Marine Drive, Ernakulam', price: 42000, bhk: 3, type: 'Apartment', description: 'Sea-facing 3 BHK premium apartment on Marine Drive. Breathtaking backwater views, modular kitchen, premium fittings. Walking distance to MG Road shopping.' },
    { title: '2 BHK Cochin Smart City Flat', city: 'Kochi', location: 'Kakkanad, Cochin Smart City', price: 20000, bhk: 2, type: 'Apartment', description: 'Modern 2 BHK near Cochin Smart City IT hub. Ideal for Infosys, UST, and Oracle employees. Swimming pool, gym, 24/7 security.' },
    { title: '4 BHK Villa — Edappally', city: 'Kochi', location: 'Edappally, Kochi', price: 68000, bhk: 4, type: 'Villa', description: 'Elegant 4 BHK villa with private pool, Jacuzzi, and lush garden in Edappally. Premium fittings, smart home automation, 3-car garage.' },
    { title: 'Commercial Space — Kadavanthra', city: 'Kochi', location: 'Kadavanthra, Kochi', price: 55000, bhk: null, type: 'Office', description: '2,500 sqft commercial office in Kadavanthra business district. Furnished, parking, 24/7 access. Suitable for legal, CA, or consulting firms.' },
    { title: '1 BHK — Thrikkakara', city: 'Kochi', location: 'Thrikkakara, Kochi', price: 10000, bhk: 1, type: 'Apartment', description: 'Compact 1 BHK flat near Trikkakara. Close to HiLITE Mall and Cochin Special Economic Zone. Lift, 24/7 water.', },
  ];
  kocProps.forEach(p => props.push({ ...p, owner_id: koc }));

  // ── THIRUVANANTHAPURAM (Kerala) ────────────────────────────────────────
  const tvm = ownerIds[5];
  props.push({ title: '3 BHK Apartment — Kowdiar', city: 'Thiruvananthapuram', location: 'Kowdiar, Thiruvananthapuram', price: 22000, bhk: 3, type: 'Apartment', description: 'Well-maintained 3 BHK in Kowdiar, near Raj Bhavan. Lift, power backup, covered parking. Quiet upscale residential locality.', owner_id: tvm });
  props.push({ title: '2 BHK Flat — Pattom', city: 'Thiruvananthapuram', location: 'Pattom, Thiruvananthapuram', price: 14000, bhk: 2, type: 'Apartment', description: '2 BHK apartment in Pattom near Secretariat and Technopark. Good bus connectivity, lift, 24/7 water supply.', owner_id: tvm });
  props.push({ title: 'IT Office — Technopark Phase 2', city: 'Thiruvananthapuram', location: 'Technopark Phase-2, TVM', price: 65000, bhk: null, type: 'Office', description: '3,000 sqft ready-to-move office in Technopark Phase 2. 24/7 access, power backup, cafeteria, green building certified.', owner_id: tvm });
  props.push({ title: '3 BHK Villa — Vattiyoorkavu', city: 'Thiruvananthapuram', location: 'Vattiyoorkavu, TVM', price: 28000, bhk: 3, type: 'Villa', description: 'Spacious 3 BHK villa with private garden and car porch. Quiet residential area with good schools and hospitals.', owner_id: tvm });

  // ── KOZHIKODE (Kerala) ────────────────────────────────────────────────
  props.push({ title: '3 BHK Sea-View Apartment — Calicut Beach', city: 'Kozhikode', location: 'Calicut Beach Road, Kozhikode', price: 18000, bhk: 3, type: 'Apartment', description: 'Beautiful 3 BHK apartment with Arabian Sea views in Calicut. Lift, generator backup, parking. Walking distance to beach.', owner_id: tvm });
  props.push({ title: '2 BHK Flat — Mavoor Road', city: 'Kozhikode', location: 'Mavoor Road, Kozhikode', price: 11000, bhk: 2, type: 'Apartment', description: 'Neat 2 BHK flat near Mavoor road, Kozhikode. 24/7 water, lift, security. Close to shopping, KSRTC bus stand and medical facilities.', owner_id: tvm });

  // ── THRISSUR (Kerala) ─────────────────────────────────────────────────
  props.push({ title: '3 BHK House — Thrissur Roundabout', city: 'Thrissur', location: 'Round South, Thrissur', price: 17000, bhk: 3, type: 'House', description: 'Independent 3 BHK house near Thrissur Roundabout. Large hall, covered parking, terrace. Centrally located near banks, markets and temples.', owner_id: tvm });

  // ── VISAKHAPATNAM (Andhra Pradesh) ────────────────────────────────────
  const vzg = ownerIds[4];
  const vzgProps = [
    { title: '3 BHK Sea-View Flat — Beach Road', city: 'Visakhapatnam', location: 'Beach Road, Vizag', price: 30000, bhk: 3, type: 'Apartment', description: 'Stunning 3 BHK apartment with direct Bay of Bengal sea views on iconic Beach Road. Premium fittings, 24/7 security, power backup and parking.' },
    { title: '2 BHK IT Flat — MVP Colony', city: 'Visakhapatnam', location: 'MVP Colony, Vizag', price: 16000, bhk: 2, type: 'Apartment', description: '2 BHK apartment in prestigious MVP Colony. Near Infosys, HPCL and Vizag Steel. Lift, covered parking, gym and club house.' },
    { title: '4 BHK Bungalow — Rushikonda Hills', city: 'Visakhapatnam', location: 'Rushikonda, Vizag', price: 55000, bhk: 4, type: 'Villa', description: 'Exclusive 4 BHK hills-facing bungalow with sea glimpse from terrace. Private garden, wooden finishes, modular kitchen. Tranquil premium living.' },
    { title: 'Office Space — Siripuram Junction', city: 'Visakhapatnam', location: 'Siripuram Junction, Vizag', price: 48000, bhk: null, type: 'Office', description: '2,000 sqft commercial office space in Siripuram junction. Furnished, ready to move, suitable for IT/BPO, consulting or training centres.' },
  ];
  vzgProps.forEach(p => props.push({ ...p, owner_id: vzg }));

  // ── VIJAYAWADA (Andhra Pradesh) ───────────────────────────────────────
  props.push({ title: '3 BHK Apartment — Benz Circle', city: 'Vijayawada', location: 'Benz Circle, Vijayawada', price: 18000, bhk: 3, type: 'Apartment', description: '3 BHK flat near Benz Circle, Vijayawada. Gated community with CCTV, lift, power backup. Close to bus station, hospitals and malls.', owner_id: vzg });
  props.push({ title: '2 BHK Flat — Governorpet', city: 'Vijayawada', location: 'Governorpet, Vijayawada', price: 12000, bhk: 2, type: 'Apartment', description: '2 BHK flat in heart of Vijayawada. Centrally located near Siddhartha Medical College, HTM Hotel and commercial areas.', owner_id: vzg });
  props.push({ title: 'Commercial Plot — Auto Nagar', city: 'Vijayawada', location: 'Auto Nagar, Vijayawada', price: 25000, bhk: null, type: 'Shop', description: 'Prime commercial shop space in Auto Nagar industrial area. Ground floor, high visibility, ideal for auto spare parts, service centre or workshop.', owner_id: vzg });

  // ── TIRUPATI (Andhra Pradesh) ─────────────────────────────────────────
  props.push({ title: '2 BHK Flat — Balaji Nagar', city: 'Tirupati', location: 'Balaji Nagar, Tirupati', price: 10000, bhk: 2, type: 'Apartment', description: '2 BHK apartment near Balaji Nagar, Tirupati. Temple town living with clean air and peaceful surroundings. Lift, 24/7 water.', owner_id: vzg });

  // ── NIZAMABAD (Telangana) ─────────────────────────────────────────────
  props.push({ title: '3 BHK Independent House — Nizamabad', city: 'Nizamabad', location: 'Near Collector Office, Nizamabad', price: 10000, bhk: 3, type: 'House', description: '3 BHK house with terrace and car parking. Peaceful residential locality near collectorate. Suitable for government employees and families.', owner_id: hyd });

  // ── MANGALURU (Karnataka) ─────────────────────────────────────────────
  props.push({ title: '3 BHK Flat — Hampankatta', city: 'Mangaluru', location: 'Hampankatta, Mangaluru', price: 20000, bhk: 3, type: 'Apartment', description: 'Spacious 3 BHK near Hampankatta city centre. Lift, parking, 24/7 security. walking distance to KMC hospital and City Centre Mall.', owner_id: mys });
  props.push({ title: '2 BHK — Bejai', city: 'Mangaluru', location: 'Bejai, Mangaluru', price: 13000, bhk: 2, type: 'Apartment', description: '2 BHK flat in Bejai, Mangaluru. Close to National Institute of Technology and beaches. Society with lift and power backup.', owner_id: mys });

  // ── PUDUCHERRY ────────────────────────────────────────────────────────
  props.push({ title: '2 BHK French Quarter Apartment', city: 'Puducherry', location: 'White Town, Puducherry', price: 18000, bhk: 2, type: 'Apartment', description: 'Charming 2 BHK apartment in heritage White Town (French Quarter). High ceilings, French doors, balcony. Walking to Promenade beach and cafes.', owner_id: chn });
  props.push({ title: '3 BHK Villa — Auroshri Layout', city: 'Puducherry', location: 'Auroshri, Puducherry', price: 24000, bhk: 3, type: 'Villa', description: 'Stunning 3 BHK villa near Auroville. Solar panels, rainwater harvesting, garden. Eco-friendly living with French city ambiance.', owner_id: chn });

  // ── SALEM (Tamil Nadu) ─────────────────────────────────────────────────
  props.push({ title: '3 BHK House — Fairlands', city: 'Salem', location: 'Fairlands, Salem', price: 12000, bhk: 3, type: 'House', description: '3 BHK independent house in upscale Fairlands, Salem. Separate car porch, spacious hall, modular kitchen. Near SBOA school and hospitals.', owner_id: cbe });

  return props;
}

// ── Main seeder ────────────────────────────────────────────────────────────
async function seed() {
  try {
    await initializeSchema();
    const pool = await getPool();
    const hash = await bcrypt.hash('Owner@123', 10);

    console.log('\n[Seed] Creating demo owner accounts...');
    const ownerIds = [];

    for (const o of OWNERS) {
      // Check if already exists
      const existing = await query(
        'SELECT id FROM Users WHERE email = @email',
        { email: { type: sql.NVarChar(100), value: o.email } }
      );
      if (existing.recordset.length > 0) {
        ownerIds.push(existing.recordset[0].id);
        console.log(`[Seed] Owner exists: ${o.email}`);
      } else {
        const id = 'owner_' + uuidv4();
        await query(
          `INSERT INTO Users (id, name, email, password_hash, role) VALUES (@id, @name, @email, @hash, 'owner')`,
          {
            id   : { type: sql.VarChar(50),   value: id },
            name : { type: sql.NVarChar(100),  value: o.name },
            email: { type: sql.NVarChar(100),  value: o.email },
            hash : { type: sql.NVarChar(255),  value: hash },
          }
        );
        ownerIds.push(id);
        console.log(`[Seed] ✅ Created owner: ${o.email}`);
      }
    }

    const properties = makeProperties(ownerIds);
    console.log(`\n[Seed] Inserting ${properties.length} South India properties...`);

    let created = 0, skipped = 0;
    for (const p of properties) {
      const check = await query(
        'SELECT id FROM Properties WHERE title = @title AND city = @city',
        {
          title: { type: sql.NVarChar(200), value: p.title },
          city : { type: sql.NVarChar(100), value: p.city  },
        }
      );
      if (check.recordset.length > 0) { skipped++; continue; }

      const id = 'prop_' + uuidv4();
      await query(
        `INSERT INTO Properties (id, owner_id, title, city, location, price, bhk, type, description, status)
         VALUES (@id, @oid, @title, @city, @loc, @price, @bhk, @type, @desc, 'available')`,
        {
          id   : { type: sql.VarChar(50),    value: id },
          oid  : { type: sql.VarChar(50),    value: p.owner_id },
          title: { type: sql.NVarChar(200),  value: p.title },
          city : { type: sql.NVarChar(100),  value: p.city },
          loc  : { type: sql.NVarChar(200),  value: p.location || p.city },
          price: { type: sql.Decimal(18,2),  value: p.price },
          bhk  : { type: sql.Int,            value: p.bhk || null },
          type : { type: sql.NVarChar(50),   value: p.type },
          desc : { type: sql.NVarChar(4000), value: p.description || '' },
        }
      );
      created++;
    }

    console.log(`\n[Seed] ✅ Done!`);
    console.log(`       Created : ${created} properties`);
    console.log(`       Skipped : ${skipped} (already exist)`);
    console.log(`       Total DB: ${created + skipped} South India properties`);
    console.log(`\n[Seed] 🔑 Owner login password: Owner@123`);
    console.log(`[Seed] Owner accounts created:\n`);
    OWNERS.forEach(o => console.log(`       ${o.email}  /  Owner@123  (${o.city})`));
    process.exit(0);
  } catch (err) {
    console.error('[Seed] ❌ Error:', err.message);
    process.exit(1);
  }
}

seed();
