# Athletic Tracker MVP - Voice-Powered Workout Logging

A voice-first workout tracking application built for competitive swimmers. Athletes describe their workouts naturally, and AI converts speech into structured training data.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- AssemblyAI account (speech-to-text)
- Anthropic API account (workout analysis)

### 1. Clone and Install
```bash
git clone <repository-url>
cd athletic-tracker-mvp
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup
1. Create a new Supabase project
2. Run the SQL in `database/schema.sql` in your Supabase SQL editor
3. Enable Row Level Security in your Supabase dashboard

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **AI Processing**: AssemblyAI (speech-to-text) + Claude (workout analysis)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (recommended)

### Core Features
- **Voice Recording**: Browser-based audio capture with pause/resume
- **AI Processing**: Convert natural speech to structured workout data
- **Manual Review**: Edit and correct AI-parsed workouts
- **Workout History**: Track progress and consistency over time
- **PWA Support**: App-like experience without app store complexity

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   └── voice/         # Voice processing endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   └── VoiceRecorder.tsx # Voice recording interface
├── lib/                  # Utility libraries
│   ├── supabase.ts      # Database client
│   └── utils.ts         # Helper functions
└── types/               # TypeScript definitions
    ├── index.ts         # Core data types
    └── supabase.ts      # Database types
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API key | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |

## 🎯 User Flow

1. **Record Workout**: Athlete taps microphone and describes workout naturally
2. **AI Processing**: Speech converted to text, then parsed into structured data
3. **Review & Edit**: User reviews AI results and makes corrections
4. **Save**: Workout stored with original transcript and processed data
5. **Track Progress**: Historical view shows trends and consistency

## 🧪 Testing

### Voice Processing Test Cases
Test the AI with real swimming workout descriptions:
- "We did a 400 free warm up, then 8 times 50 fly on the minute"
- "Main set was 4 rounds of 3 times 100 IM on 2 minutes"
- "Cool down with 300 easy choice and some kicking"

### Expected AI Output
The system should extract:
- Total distance and duration
- Individual sets with stroke, distance, intervals
- Workout type classification (warmup, main, cooldown)
- Stroke distribution percentages

## 📊 Success Metrics

### Technical KPIs
- Voice processing accuracy: >70% structured data extraction
- Workout logging time: <30 seconds average
- Page load time: <2 seconds on mobile
- Uptime: >99.5% availability

### User Experience KPIs
- 8+ week retention rate: >40%
- Voice recording completion: >90%
- Manual correction frequency: <30% of workouts
- User satisfaction with AI accuracy

## 🚢 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm run start
```

## 🔒 Security

- **Row Level Security**: Database access restricted to authenticated users
- **API Protection**: AI API keys secured server-side
- **Data Privacy**: Voice recordings processed temporarily, not stored
- **CORS**: Configured for production domains only

## 📋 Phase 1 MVP Scope

### ✅ Included Features
- Voice-based workout logging
- AI speech-to-text and parsing
- Manual review and editing
- Basic workout history
- User authentication
- Simple 1-3 rating system
- Volume and consistency tracking

### ❌ Excluded from MVP
- Social features or sharing
- Coach/team integration
- Advanced analytics
- Race time predictions
- Nutrition or recovery tracking
- Complex load calculations

## 🗺️ Roadmap

### Phase 1.5 (Months 4-5)
- Achievement tracking and PR detection
- Advanced volume analytics
- Workout streak counters
- Data export functionality

### Phase 2 (Months 6-12)
- Team and coach features
- Multi-user architecture
- Coach dashboard and athlete monitoring
- Training plan assignment

### Phase 3 (Year 2+)
- Advanced AI features
- Competition integration
- Additional sport support
- Enterprise/club licensing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 📞 Support

For questions or issues:
- Check the `/project-docs/` directory for detailed documentation
- Review session summaries in `/project-docs/chat-summaries/`
- Open an issue in the repository

---

**Built for athletes who want to track training without the data entry friction.**

