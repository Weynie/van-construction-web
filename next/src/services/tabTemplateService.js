// Tab Template Service - Handles template definitions and delta data merging
export const tabTemplateService = {
  
  // Define all tab templates with default values
  TAB_TEMPLATES: {
    Welcome: {
      content: `
        <div class="welcome-content">
          <div class="feature-overview">
            <h3>Available Tools:</h3>
            <ul>
              <li><strong>Snow Load Calculator</strong> - Calculate snow loads for various roof configurations</li>
              <li><strong>Wind Load Calculator</strong> - Determine wind pressure loads for structures</li>
              <li><strong>Seismic Analysis</strong> - Get seismic hazard data for specific locations</li>
            </ul>
          </div>
          <div class="getting-started">
            <h3>Getting Started:</h3>
            <ol>
              <li>Create a new tab using the "+" button</li>
              <li>Select the appropriate calculator type</li>
              <li>Enter your project parameters</li>
              <li>Review the calculated results</li>
            </ol>
          </div>
        </div>
      `,
      // No mutable data for welcome tabs
      mutableData: {}
    },

    welcome: {
      content: `
        <div class="welcome-content">
          <div class="feature-overview">
            <h3>Available Tools:</h3>
            <ul>
              <li><strong>Snow Load Calculator</strong> - Calculate snow loads for various roof configurations</li>
              <li><strong>Wind Load Calculator</strong> - Determine wind pressure loads for structures</li>
              <li><strong>Seismic Analysis</strong> - Get seismic hazard data for specific locations</li>
            </ul>
          </div>
          <div class="getting-started">
            <h3>Getting Started:</h3>
            <ol>
              <li>Create a new tab using the "+" button</li>
              <li>Select the appropriate calculator type</li>
              <li>Enter your project parameters</li>
              <li>Review the calculated results</li>
            </ol>
          </div>
        </div>
      `,
      // No mutable data for welcome tabs
      mutableData: {}
    },

    design_tables: {
      content: `
        <div class="design-tables-content">
          <div class="workspace-area">
            <h3>Design Tables & Diagrams</h3>
            <p>This is your workspace for helper diagrams, reference tables, and design documentation.</p>
            <div class="placeholder-content">
              <div class="table-placeholder">
                <h4>Helper Tables</h4>
                <p>Add structural design tables, load charts, and reference data here.</p>
              </div>
              <div class="diagram-placeholder">
                <h4>Design Diagrams</h4>
                <p>Create and manage structural diagrams, sketches, and visual aids.</p>
              </div>
            </div>
          </div>
        </div>
      `,
      // Mutable data for design tables workspace
      mutableData: {
        tables: [],
        diagrams: [],
        notes: ""
      }
    },

    snow_load: {
      // Snow Load Tab mutable variables (user can modify these)
      snowDefaults: {
        location: 'North Vancouver',
        slope: 1,
        is: 1,
        ca: 1,
        cb: 0.8
      },

      // Snow Drifting Load Calculator mutable variables
      driftDefaults: {
        // General Input
        a: 1.0,      // Horizontal gap between upper and lower roofs
        h: 5.0,      // Difference in elevation between lower roof surface and top of the parapet of the upper roof
        hp_lower: 2.0, // Parapet height of lower-roof source area
        x: 3.0,      // Optional: Point of interest
        
        // Case 1 Input
        ws_upper: 10.0,  // Shorter dimension of (upper roof) source area in Case 1
        ls_upper: 15.0,  // Longer dimension of (upper roof) source area in Case 1
        hp_upper: 1.0,   // Parapet height of upper-roof source area in Case 1
        
        // Case 2 Input
        ws_lower2: 15.0, // Shorter dimension of (lower roof) source area in Case 2
        ls_lower2: 20.0, // Longer dimension of (lower roof) source area in Case 2
        
        // Case 3 Input
        ws_lower3: 15.0, // Shorter dimension of (lower roof) source area in Case 3
        ls_lower3: 25.0  // Longer dimension of (lower roof) source area in Case 3
      },

      // Immutable calculation constants (never stored in database)
      immutableConstants: {
        // Additional parameters needed for calculations
        Ss: 2.0,           // Ground snow load (kPa) - will be updated from location data
        Sr: 0.0,           // Rain load (kPa) - will be updated from location data
        γ: 3.0,            // Snow density (kN/m³)
        Cb: 1.0,           // Basic roof snow load factor
        Cs_default: 1.0,   // Default slope factor
        Is: 1.0,           // Importance factor
        Ca: 1.0,           // Accumulation factor
        Cw: 1.0,           // Wind factor
        
        // Calculation formulas and constants
        calculationMethods: {
          basicSnowLoad: 'S = Ss * Cb * Cs * Is * Ca * Cw',
          driftLoad: 'Calculated based on NBC 2020 specifications'
        }
      },

      // Results (calculated values, will be stored if user performs calculations)
      results: {
        basicSnowLoad: null,
        driftResults: {
          case1: null,
          case2: null,
          case3: null
        }
      }
    },

    wind_load: {
      // Wind Load Tab mutable variables
      windDefaults: {
        location: 'Richmond',
        iw: 1,
        ce: 0.7,
        ct: 1
      },

      // Immutable calculation constants
      immutableConstants: {
        // Wind pressure calculation constants
        q: 0.613,           // Air density factor (kg/m³)
        referenceVelocity: 50, // Reference velocity (m/s) - will be updated from location data
        
        // Calculation formulas
        calculationMethods: {
          windPressure: 'q = 0.5 * ρ * V² * Ce * Ct * Iw'
        }
      },

      // Results (calculated values)
      results: {
        windPressure: null,
        designPressure: null
      }
    },

    design_tables: {
      content: `
        <div class="design-tables-content">
          <h1>Design Tables</h1>
          <p>Custom design tables and calculations workspace.</p>
          <div class="tables-area">
            <h3>Design Tables:</h3>
            <p>Create and manage your custom design tables here.</p>
            <textarea placeholder="Add your design notes and calculations..." rows="10" style="width: 100%; min-height: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
          </div>
        </div>
      `,
      // No mutable data for design tables by default
      mutableData: {
        notes: '',
        customData: {}
      }
    },

    seismic: {
      // Seismic Hazards Tab mutable variables
      seismicTabData: {
        designer: '',
        address: '',
        project: '',
        revision: '',
        date: '',
        bldgCode: ''
      },

      // Seismic return results (populated when data is retrieved from API)
      seismicResults: {
        site_class: null,
        coordinates: null,
        address_checked: null,
        rgb: null,
        most_similar_soil: null,
        soil_pressure: null,
        sa_site: null,
        sa_x450: null
      },

      // Immutable constants for seismic analysis
      immutableConstants: {
        apiEndpoint: '/api/seismic-info',
        requiredFields: ['address'],
        validationRules: {
          address: 'required|min:5'
        }
      }
    }
  },

  /**
   * Get the complete template for a specific tab type
   */
  getTemplate(tabType) {
    // Handle legacy display names by mapping to internal types
    const displayNameMapping = {
      'Design Tables': 'Welcome',
      'Snow Load': 'snow_load',
      'Wind Load': 'wind_load', 
      'Seismic Hazards': 'seismic'
    };
    
    const internalType = displayNameMapping[tabType] || tabType;
    const template = this.TAB_TEMPLATES[internalType];
    
    if (!template) {
      throw new Error(`Unknown tab type: ${tabType} (mapped to: ${internalType})`);
    }
    return JSON.parse(JSON.stringify(template)); // Deep clone
  },

  /**
   * Get only the mutable data template for a tab type
   */
  getMutableTemplate(tabType) {
    const template = this.getTemplate(tabType);
    const mutableData = {};
    
    // Extract all mutable fields from the template
    Object.keys(template).forEach(key => {
      if (key !== 'immutableConstants') {
        mutableData[key] = template[key];
      }
    });
    
    return mutableData;
  },

  /**
   * Merge delta data from database with the template
   */
  mergeWithTemplate(tabType, deltaData) {
    const template = this.getTemplate(tabType);
    
    if (!deltaData || Object.keys(deltaData).length === 0) {
      return template;
    }

    // Deep merge delta data with template
    const merged = this.deepMerge(template, deltaData);
    return merged;
  },

  /**
   * Extract only the changes from current data compared to template
   */
  extractDelta(tabType, currentData) {
    const template = this.getTemplate(tabType);
    const delta = {};
    
    // Compare currentData with template and extract differences
    this.extractDifferences(template, currentData, delta, '');
    
    return delta;
  },

  /**
   * Validate that a tab type is supported
   */
  isValidTabType(tabType) {
    return Object.keys(this.TAB_TEMPLATES).includes(tabType);
  },

  /**
   * Get list of all supported tab types
   */
  getSupportedTabTypes() {
    return Object.keys(this.TAB_TEMPLATES);
  },

  /**
   * Deep merge two objects
   */
  deepMerge(target, source) {
    const result = JSON.parse(JSON.stringify(target));
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (this.isObject(source[key]) && this.isObject(result[key])) {
          result[key] = this.deepMerge(result[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  },

  /**
   * Extract differences between template and current data
   */
  extractDifferences(template, current, delta, path) {
    for (const key in current) {
      if (current.hasOwnProperty(key)) {
        // Skip immutableConstants - they should never be stored in database
        if (key === 'immutableConstants') {
          continue;
        }
        
        const currentPath = path ? `${path}.${key}` : key;
        
        if (this.isObject(current[key]) && this.isObject(template[key])) {
          const nestedDelta = {};
          this.extractDifferences(template[key], current[key], nestedDelta, currentPath);
          if (Object.keys(nestedDelta).length > 0) {
            delta[key] = nestedDelta;
          }
        } else if (current[key] !== template[key]) {
          delta[key] = current[key];
        }
      }
    }
  },

  /**
   * Check if value is an object (but not array or null)
   */
  isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  },

  /**
   * Initialize tab data with template defaults
   */
  initializeTabData(tabType) {
    const template = this.getTemplate(tabType);
    return {
      type: tabType,
      data: template,
      lastModified: new Date().toISOString()
    };
  },

  /**
   * Prepare data for database storage (extract only delta)
   */
  prepareForStorage(tabType, currentData) {
    const delta = this.extractDelta(tabType, currentData);
    return {
      tabType,
      data: delta,
      lastModified: new Date().toISOString()
    };
  },

  /**
   * Prepare data for UI rendering (merge delta with template)
   */
  prepareForRendering(tabType, deltaData) {
    const mergedData = this.mergeWithTemplate(tabType, deltaData);
    return {
      type: tabType,
      data: mergedData,
      lastModified: new Date().toISOString()
    };
  }
}; 