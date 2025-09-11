# Alexandria API Configuration

## 🔧 Changing the Backend Server IP Address

To update the backend server IP address for development or testing, you only need to change it in **ONE** location:

### 📍 Single Source of Truth: `app.json`

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "http://YOUR_NEW_IP:8000"
    }
  }
}
```

### 🚀 How it Works

1. **`app.json`** - Contains the master configuration under `extra.apiBaseUrl`
2. **`config/api.js`** - Reads the configuration from app.json and exports `API_BASE_URL`
3. **All other files** - Import `API_BASE_URL` from `config/api.js`

### ✅ Updated Files (Now Using Centralized Config)

- ✅ `screens/AskAlexandriaScreen.js`
- ✅ `services/EnhancedExplanationService.js`  
- ✅ `navigation/AppNavigator.js`
- ✅ `services/AdvancedAnalyticsService.js`
- ✅ `screens/ReviewScreen.js`
- ✅ `screens/ResultsScreen.js`

### 🔄 Steps to Change IP Address

1. Update the IP in `app.json`:
   ```json
   "apiBaseUrl": "http://NEW_IP_ADDRESS:8000"
   ```

2. Restart your development server:
   ```bash
   expo start --clear
   ```

3. That's it! All API calls will now use the new IP address.

### 🐛 Troubleshooting

If you see hardcoded IP addresses in any file, please update them to use the centralized configuration:

```javascript
// ❌ Bad - Hardcoded IP
const response = await fetch('http://192.168.1.100:8000/endpoint');

// ✅ Good - Centralized config
import { API_BASE_URL } from '../config/api';
const response = await fetch(`${API_BASE_URL}/endpoint`);
```

### 📝 Note

The configuration system uses Expo Constants to read from `app.json`, so changes require a restart of the development server to take effect.