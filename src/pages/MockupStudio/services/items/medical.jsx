import React from 'react';

import { Icons } from '../../components/MockupIcons';

export const medicalItems = [
  {
    id: 'pill_bottle_amber',
    label: 'Pill Bottle (Amber)',
    description: 'Classic amber prescription pill bottle.',
    formatSpec: 'transparent amber plastic prescription pill bottle with white safety cap',
    subjectNoun: 'pill bottle',
    icon: <Icons.PillBottle />,
    category: 'Medical'
  },
  {
    id: 'pill_bottle_white',
    label: 'Supplement Bottle',
    description: 'White plastic supplement bottle.',
    formatSpec: 'white HDPE plastic supplement pill bottle',
    subjectNoun: 'supplement bottle',
    icon: <Icons.PillBottle />,
    category: 'Medical'
  },
  {
    id: 'medical_dropper',
    label: 'Dropper Bottle',
    description: 'Amber glass medical dropper bottle.',
    formatSpec: 'amber glass medical dropper bottle for tinctures',
    subjectNoun: 'dropper bottle',
    icon: <Icons.MedicalDropper />,
    category: 'Medical'
  },
  {
    id: 'nasal_spray',
    label: 'Nasal Spray',
    description: 'Plastic medical spray bottle.',
    formatSpec: 'plastic nasal spray bottle',
    subjectNoun: 'nasal spray',
    icon: <Icons.NasalSpray />,
    category: 'Medical'
  },
  {
    id: 'blister_pack',
    label: 'Blister Pack',
    description: 'Foil and plastic pill blister pack.',
    formatSpec: 'pharmaceutical blister pack packaging',
    subjectNoun: 'blister pack',
    icon: <Icons.BlisterPack />,
    category: 'Medical'
  },
  {
    id: 'ointment_tube',
    label: 'Ointment Tube',
    description: 'Aluminum medical ointment tube.',
    formatSpec: 'aluminum medical ointment tube packaging',
    subjectNoun: 'ointment tube',
    icon: <Icons.OintmentTube />,
    category: 'Medical'
  },
  {
    id: 'first_aid_kit',
    label: 'First Aid Kit',
    description: 'Hard case first aid kit.',
    formatSpec: 'hard plastic first aid kit case',
    subjectNoun: 'first aid kit',
    icon: <Icons.FirstAidKit />,
    category: 'Medical'
  },
  {
    id: 'test_kit',
    label: 'Test Kit',
    description: 'Medical rapid test cassette.',
    formatSpec: 'plastic rapid lateral flow test cassette',
    subjectNoun: 'test kit',
    icon: <Icons.TestKit />,
    category: 'Medical'
  },
  {
    id: 'pharmacy_bag',
    label: 'Pharmacy Bag',
    description: 'Paper prescription bag.',
    formatSpec: 'white paper pharmacy prescription bag',
    subjectNoun: 'pharmacy bag',
    icon: <Icons.PharmacyBag />,
    category: 'Medical'
  },
  {
    id: 'medical_scrubs',
    label: 'Scrubs Top',
    description: 'V-neck medical scrubs top.',
    formatSpec: 'folded medical scrubs top uniform',
    subjectNoun: 'scrubs top',
    icon: <Icons.Scrubs />,
    category: 'Medical'
  },
  {
    id: 'lab_coat',
    label: 'Lab Coat',
    description: 'White medical lab coat.',
    formatSpec: 'white medical lab coat uniform hanging',
    subjectNoun: 'lab coat',
    icon: <Icons.LabCoat />,
    category: 'Medical'
  },
  {
    id: 'patient_wristband',
    label: 'Wristband',
    description: 'Hospital patient identification band.',
    formatSpec: 'plastic hospital patient ID wristband',
    subjectNoun: 'wristband',
    icon: <Icons.Wristband />,
    category: 'Medical'
  },
  {
    id: 'hospital_id',
    label: 'Hospital ID',
    description: 'Staff identification badge.',
    formatSpec: 'plastic hospital staff ID card badge',
    subjectNoun: 'ID card',
    icon: <Icons.HospitalID />,
    category: 'Medical'
  },
  {
    id: 'pill_organizer',
    label: 'Pill Organizer',
    description: 'Weekly plastic pill sorter.',
    formatSpec: 'plastic weekly pill organizer box',
    subjectNoun: 'pill organizer',
    icon: <Icons.PillOrganizer />,
    category: 'Medical'
  },
  {
    id: 'dental_floss',
    label: 'Dental Floss',
    description: 'Plastic dental floss container.',
    formatSpec: 'plastic dental floss container',
    subjectNoun: 'floss container',
    icon: <Icons.DentalFloss />,
    category: 'Medical'
  },
  {
    id: 'vaccine_vial',
    label: 'Vial',
    description: 'Glass medical vaccine vial.',
    formatSpec: 'glass medical vaccine vial with rubber stopper and metal cap',
    subjectNoun: 'medical vial',
    icon: <Icons.Vial />,
    category: 'Medical'
  },
  {
    id: 'iv_bag',
    label: 'IV Bag',
    description: 'Clear plastic IV fluid bag.',
    formatSpec: 'clear plastic IV fluid drip bag',
    subjectNoun: 'IV bag',
    icon: <Icons.IVBag />,
    category: 'Medical'
  },
  {
    id: 'blood_bag',
    label: 'Blood Bag',
    description: 'Medical blood transfusion bag.',
    formatSpec: 'medical blood transfusion bag',
    subjectNoun: 'blood bag',
    icon: <Icons.BloodBag />,
    category: 'Medical'
  },
  {
    id: 'syringe_box',
    label: 'Syringe Box',
    description: 'Retail box for syringes.',
    formatSpec: 'paperboard packaging box for medical syringes',
    subjectNoun: 'syringe box',
    icon: <Icons.SyringeBox />,
    category: 'Medical'
  },
  {
    id: 'syringe_item',
    label: 'Syringe',
    description: 'Disposable plastic syringe.',
    formatSpec: 'disposable plastic medical syringe',
    subjectNoun: 'medical syringe',
    icon: <Icons.SyringeItem />,
    category: 'Medical'
  },
  {
    id: 'bandage_box',
    label: 'Bandage Box',
    description: 'Box of adhesive bandages.',
    formatSpec: 'retail box of adhesive bandages',
    subjectNoun: 'bandage box',
    icon: <Icons.FirstAidKit />, // Reusing generic box/kit icon
    category: 'Medical'
  },
  {
    id: 'glove_box',
    label: 'Glove Box',
    description: 'Box of disposable exam gloves.',
    formatSpec: 'cardboard dispenser box for disposable medical exam gloves',
    subjectNoun: 'glove box',
    icon: <Icons.GloveBox />,
    category: 'Medical'
  },
  {
    id: 'medical_mask_box',
    label: 'Mask Box',
    description: 'Box of surgical masks.',
    formatSpec: 'retail box packaging for surgical face masks',
    subjectNoun: 'mask box',
    icon: <Icons.MedicalMask />,
    category: 'Medical'
  },
  {
    id: 'surgical_mask',
    label: 'Surgical Mask',
    description: 'Pleated medical face mask.',
    formatSpec: 'blue pleated surgical face mask',
    subjectNoun: 'face mask',
    icon: <Icons.MaskItem />,
    category: 'Medical'
  },
  {
    id: 'n95_mask',
    label: 'N95 Respirator',
    description: 'N95 protective face mask.',
    formatSpec: 'white N95 respirator face mask',
    subjectNoun: 'N95 mask',
    icon: <Icons.N95Mask />,
    category: 'Medical'
  },
  {
    id: 'face_shield',
    label: 'Face Shield',
    description: 'Transparent protective face shield.',
    formatSpec: 'transparent medical protective face shield',
    subjectNoun: 'face shield',
    icon: <Icons.FaceShield />,
    category: 'Medical'
  },
  {
    id: 'prescription_pad',
    label: 'Rx Pad',
    description: 'Doctor\'s prescription notepad.',
    formatSpec: 'medical doctor\'s Rx prescription notepad',
    subjectNoun: 'prescription pad',
    icon: <Icons.PrescriptionPad />,
    category: 'Medical'
  },
  {
    id: 'medical_folder',
    label: 'Medical Chart',
    description: 'Manila medical file folder.',
    formatSpec: 'manila medical file folder chart',
    subjectNoun: 'medical folder',
    icon: <Icons.MedicalFolder />,
    category: 'Medical'
  },
  {
    id: 'biohazard_bag',
    label: 'Biohazard Bag',
    description: 'Red medical waste bag.',
    formatSpec: 'red plastic biohazard medical waste bag',
    subjectNoun: 'biohazard bag',
    icon: <Icons.BiohazardBag />,
    category: 'Medical'
  },
  {
    id: 'thermometer_box',
    label: 'Thermometer',
    description: 'Digital thermometer packaging.',
    formatSpec: 'retail packaging box for digital thermometer',
    subjectNoun: 'thermometer box',
    icon: <Icons.ThermometerBox />,
    category: 'Medical'
  },
  {
    id: 'stethoscope',
    label: 'Stethoscope',
    description: 'Acoustic medical stethoscope.',
    formatSpec: 'acoustic medical stethoscope',
    subjectNoun: 'stethoscope',
    icon: <Icons.Stethoscope />,
    category: 'Medical'
  },
  {
    id: 'inhaler',
    label: 'Asthma Inhaler',
    description: 'Metered-dose inhaler.',
    formatSpec: 'metered-dose asthma inhaler',
    subjectNoun: 'inhaler',
    icon: <Icons.Inhaler />,
    category: 'Medical'
  },
  {
    id: 'bp_monitor',
    label: 'BP Monitor',
    description: 'Digital blood pressure monitor.',
    formatSpec: 'digital upper arm blood pressure monitor',
    subjectNoun: 'blood pressure monitor',
    icon: <Icons.BPMonitor />,
    category: 'Medical'
  },
  {
    id: 'pulse_oximeter',
    label: 'Pulse Oximeter',
    description: 'Finger pulse oximeter.',
    formatSpec: 'fingertip pulse oximeter',
    subjectNoun: 'pulse oximeter',
    icon: <Icons.PulseOximeter />,
    category: 'Medical'
  },
  {
    id: 'glucose_meter',
    label: 'Glucose Meter',
    description: 'Blood glucose monitoring system.',
    formatSpec: 'digital blood glucose meter',
    subjectNoun: 'glucose meter',
    icon: <Icons.GlucoseMeter />,
    category: 'Medical'
  },
  {
    id: 'bandage_roll',
    label: 'Gauze Bandage',
    description: 'Rolled white medical gauze.',
    formatSpec: 'rolled medical gauze bandage',
    subjectNoun: 'gauze roll',
    icon: <Icons.BandageRoll />,
    category: 'Medical'
  },
  {
    id: 'medicine_cup',
    label: 'Medicine Cup',
    description: 'Plastic dosing cup.',
    formatSpec: 'plastic medicine dosing cup',
    subjectNoun: 'medicine cup',
    icon: <Icons.MedicineCup />,
    category: 'Medical'
  },
  {
    id: 'contact_lens_case',
    label: 'Lens Case',
    description: 'Contact lens storage case.',
    formatSpec: 'plastic contact lens storage case',
    subjectNoun: 'contact lens case',
    icon: <Icons.ContactLensCase />,
    category: 'Medical'
  },
  {
    id: 'hot_water_bottle',
    label: 'Hot Water Bottle',
    description: 'Rubber hot water bottle.',
    formatSpec: 'rubber hot water bottle',
    subjectNoun: 'hot water bottle',
    icon: <Icons.HotWaterBottle />,
    category: 'Medical'
  },
  {
    id: 'ice_pack',
    label: 'Gel Ice Pack',
    description: 'Reusable cold compress pack.',
    formatSpec: 'blue gel ice pack cold compress',
    subjectNoun: 'ice pack',
    icon: <Icons.IcePack />,
    category: 'Medical'
  }
];