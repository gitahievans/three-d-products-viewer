export const products = [
  {
    name: "Classic White Mug",
    image: "https://via.placeholder.com/150/FFFFFF/000000?Text=White+Mug",
    modelPath: 'models/placeholder1.glb', // Will attempt to load this
    color: 0xffffff, // Used by createCupModel fallback and potentially by GLTF override
    roughness: 0.6,   // Used by createCupModel fallback
    metalness: 0.0,   // Used by createCupModel fallback
    description: "A classic white ceramic mug, perfect for your morning coffee.",
  },
  {
    name: "Modern Black Tumbler",
    image: "https://via.placeholder.com/150/000000/FFFFFF?Text=Black+Tumbler",
    modelPath: 'models/placeholder2.glb', // Will attempt to load this
    color: 0x333333, // Used by createCupModel fallback
    roughness: 0.3,   // Used by createCupModel fallback
    metalness: 0.7,   // Used by createCupModel fallback (example for a more metallic look)
    description: "Sleek and modern black tumbler for your beverages on the go.",
  },
  {
    name: "Eco-Friendly Bamboo Cup",
    image: "https://via.placeholder.com/150/D2B48C/000000?Text=Bamboo+Cup",
    modelPath: null, // Will use createCupModel
    color: 0xD2B48C,
    roughness: 0.8,
    metalness: 0.0,
    description: "Sustainable and stylish bamboo cup.",
  },
  {
    name: "Glass Tea Infuser",
    image: "https://via.placeholder.com/150/ADD8E6/000000?Text=Glass+Infuser",
    modelPath: null, // Will use createCupModel
    color: 0xADD8E6,
    roughness: 0.1,
    metalness: 0.0,
    transparent: true, // Specific to glass
    opacity: 0.7,      // Specific to glass
    description: "Elegant glass tea infuser for the perfect brew.",
  },
  {
    name: "Stainless Steel Travel Mug",
    image: "https://via.placeholder.com/150/C0C0C0/000000?Text=Steel+Mug",
    modelPath: null, // Will use createCupModel
    color: 0xC0C0C0,
    roughness: 0.2,
    metalness: 0.8,
    description: "Durable stainless steel travel mug to keep your drinks hot or cold.",
  },
];
