module.exports = {
  brand: 'SAMA',
  origin: null,
  languages: { en: 'English', hi: 'हिंदी', bn: 'বাংলা' },
  email: null,
  payments: { approved: false, support: null, membership: null },
  servicesApproved: false,
  products: [
    { id: 'citta', name: 'Citta', category: 'EducationalApplication', os: 'Android, Windows', status: 'development', icon: 'assets/citta/icon.svg' },
    { id: 'sahaja', name: 'SAHAJA', category: 'ProductivityApplication', os: 'Web', status: 'documented', version: '1.0.0', icon: 'assets/sahaja/icon.svg',
      source: 'https://github.com/GauravSamrat/sahaja', docs: 'https://github.com/GauravSamrat/sahaja/blob/main/INSTALL.md',
      issues: 'https://github.com/GauravSamrat/sahaja/issues' },
    { id: 'supreme-council', name: 'Supreme Council', category: 'UtilitiesApplication', os: 'Windows', status: 'cli', version: '0.1', icon: 'assets/supreme-council/icon.svg',
      source: 'https://github.com/GauravSamrat/supreme-council', docs: 'https://github.com/GauravSamrat/supreme-council/blob/v0.1.0/README.md',
      issues: 'https://github.com/GauravSamrat/supreme-council/issues' }
  ]
  // Optional per-product fields: launch, download, icon, mobile, desktop, features, social, video, captions.
};
