# EduLearn — E-Learning Platform

> **For Claude Code:** This README is the single source of truth for this project. Read it entirely before generating any file. Follow every architectural decision, naming convention, and phase order described here. Do not skip phases or merge them.

---

## Project Overview

A full-stack distance learning platform with role-based access, course management, file uploads, quizzes, and progress tracking.

| Layer     | Technology              |
|-----------|-------------------------|
| Frontend  | Next.js 14 (App Router) |
| Backend   | NestJS                  |
| Database  | MySQL                   |
| ORM       | TypeORM                 |
| Auth      | JWT (access tokens)     |

---

## Monorepo Structure

```
elearning/
├── backend/        # NestJS API
├── frontend/       # Next.js app
├── README.md       # This file
└── .gitignore
```

---

## Backend — NestJS

### Setup commands

```bash
cd backend
npm i -g @nestjs/cli
nest new . --package-manager npm
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @nestjs/typeorm typeorm mysql2
npm install @nestjs/config
npm install bcrypt class-validator class-transformer
npm install multer @types/multer @types/bcrypt @types/passport-jwt
```

### Folder structure

```
backend/src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts
│   └── dto/
│       ├── register.dto.ts
│       └── login.dto.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── user.entity.ts
│   └── dto/
│       └── update-user.dto.ts
├── courses/
│   ├── courses.module.ts
│   ├── courses.controller.ts
│   ├── courses.service.ts
│   ├── course.entity.ts
│   └── dto/
│       ├── create-course.dto.ts
│       └── update-course.dto.ts
├── lessons/
│   ├── lessons.module.ts
│   ├── lessons.controller.ts
│   ├── lessons.service.ts
│   ├── lesson.entity.ts
│   └── dto/
│       └── create-lesson.dto.ts
├── enrollments/
│   ├── enrollments.module.ts
│   ├── enrollments.controller.ts
│   ├── enrollments.service.ts
│   └── enrollment.entity.ts
├── quizzes/
│   ├── quizzes.module.ts
│   ├── quizzes.controller.ts
│   ├── quizzes.service.ts
│   ├── quiz.entity.ts
│   ├── question.entity.ts
│   ├── quiz-attempt.entity.ts
│   └── dto/
│       ├── create-quiz.dto.ts
│       └── submit-attempt.dto.ts
├── progress/
│   ├── progress.module.ts
│   ├── progress.controller.ts
│   ├── progress.service.ts
│   └── progress.entity.ts
├── files/
│   ├── files.module.ts
│   ├── files.controller.ts
│   └── files.service.ts
├── common/
│   ├── guards/
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   └── enums/
│       └── role.enum.ts
├── config/
│   └── database.config.ts
├── app.module.ts
└── main.ts
```

### Environment variables

Create `backend/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=yourpassword
DB_NAME=elearning

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# App
PORT=3001
UPLOAD_DEST=./uploads
```

### Database entities

#### User entity (`users/user.entity.ts`)

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { Course } from '../courses/course.entity';
import { Enrollment } from '../enrollments/enrollment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // bcrypt hashed

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: Role, default: Role.STUDENT })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Course, (course) => course.teacher)
  courses: Course[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];
}
```

#### Course entity (`courses/course.entity.ts`)

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Lesson } from '../lessons/lesson.entity';
import { Enrollment } from '../enrollments/enrollment.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.courses)
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @Column()
  teacherId: string;

  @OneToMany(() => Lesson, (lesson) => lesson.course, { cascade: true })
  lessons: Lesson[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];
}
```

#### Lesson entity (`lessons/lesson.entity.ts`)

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from '../courses/course.entity';

export enum LessonType {
  VIDEO = 'video',
  PDF = 'pdf',
  TEXT = 'text',
}

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'enum', enum: LessonType, default: LessonType.TEXT })
  type: LessonType;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ default: 0 })
  order: number;

  @ManyToOne(() => Course, (course) => course.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  courseId: string;
}
```

#### Enrollment entity (`enrollments/enrollment.entity.ts`)

```typescript
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';
import { Course } from '../courses/course.entity';

@Entity('enrollments')
@Unique(['studentId', 'courseId'])
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.enrollments)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column()
  studentId: string;

  @ManyToOne(() => Course, (course) => course.enrollments)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  courseId: string;

  @CreateDateColumn()
  enrolledAt: Date;
}
```

#### Quiz and related entities (`quizzes/`)

```typescript
// quiz.entity.ts
@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ nullable: true }) description: string;
  @Column({ default: 60 }) timeLimitMinutes: number;
  @ManyToOne(() => Course) @JoinColumn({ name: 'courseId' }) course: Course;
  @Column() courseId: string;
  @OneToMany(() => Question, (q) => q.quiz, { cascade: true }) questions: Question[];
}

// question.entity.ts
@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'text' }) text: string;
  @Column('simple-array') options: string[]; // ['A', 'B', 'C', 'D']
  @Column() correctAnswer: string;           // 'A' | 'B' | 'C' | 'D'
  @Column({ default: 1 }) points: number;
  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' }) quiz: Quiz;
  @Column() quizId: string;
}

// quiz-attempt.entity.ts
@Entity('quiz_attempts')
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'studentId' }) student: User;
  @Column() studentId: string;
  @ManyToOne(() => Quiz) @JoinColumn({ name: 'quizId' }) quiz: Quiz;
  @Column() quizId: string;
  @Column({ type: 'decimal', precision: 5, scale: 2 }) score: number; // 0–100
  @Column({ type: 'json', nullable: true }) answers: Record<string, string>;
  @CreateDateColumn() submittedAt: Date;
}
```

#### Progress entity (`progress/progress.entity.ts`)

```typescript
@Entity('progress')
@Unique(['studentId', 'lessonId'])
export class Progress {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() studentId: string;
  @Column() lessonId: string;
  @Column({ default: false }) isCompleted: boolean;
  @UpdateDateColumn() updatedAt: Date;
}
```

---

### Role system

#### `common/enums/role.enum.ts`

```typescript
export enum Role {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}
```

#### `common/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

#### `common/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

#### `common/guards/roles.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

---

### Auth module

#### `auth/jwt.strategy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

#### `auth/dto/register.dto.ts`

```typescript
import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class RegisterDto {
  @IsNotEmpty() firstName: string;
  @IsNotEmpty() lastName: string;
  @IsEmail() email: string;
  @MinLength(8) password: string;
  @IsEnum(Role) role: Role;
}
```

#### Auth service logic (implement in `auth/auth.service.ts`)

```typescript
// register(): hash password with bcrypt (rounds: 10), save user, return JWT
// login(): find user by email, compare password with bcrypt.compare(), return JWT
// JWT payload: { sub: user.id, email: user.email, role: user.role }
```

---

### API routes reference

| Method | Route | Guard | Roles | Description |
|--------|-------|-------|-------|-------------|
| POST | `/auth/register` | None | — | Register new user |
| POST | `/auth/login` | None | — | Login, returns JWT |
| GET | `/auth/me` | JWT | All | Get current user |
| GET | `/users` | JWT | Admin | List all users |
| PATCH | `/users/:id/role` | JWT | Admin | Change user role |
| GET | `/courses` | None | — | List published courses |
| POST | `/courses` | JWT | Teacher | Create course |
| GET | `/courses/:id` | None | — | Get course details |
| PATCH | `/courses/:id` | JWT | Teacher | Update course |
| DELETE | `/courses/:id` | JWT | Teacher, Admin | Delete course |
| POST | `/courses/:id/enroll` | JWT | Student | Enroll in course |
| GET | `/courses/:id/lessons` | JWT | All enrolled | List lessons |
| POST | `/courses/:id/lessons` | JWT | Teacher | Add lesson |
| POST | `/files/upload` | JWT | Teacher | Upload PDF or video |
| GET | `/files/:filename` | JWT | All | Serve file |
| GET | `/quizzes/:id` | JWT | All enrolled | Get quiz with questions |
| POST | `/quizzes` | JWT | Teacher | Create quiz |
| POST | `/quizzes/:id/attempt` | JWT | Student | Submit quiz answers |
| GET | `/quizzes/:id/results` | JWT | Teacher | View all attempts |
| GET | `/progress/me` | JWT | Student | Get own progress |
| PATCH | `/progress/:lessonId/complete` | JWT | Student | Mark lesson complete |

---

### File upload

Use Multer with disk storage. Store files in `backend/uploads/`. Serve them via a static files endpoint.

```typescript
// In main.ts, add:
app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/files' });

// File filter: allow only pdf, mp4, webm
const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'video/mp4', 'video/webm'];
  cb(null, allowed.includes(file.mimetype));
};
```

---

### `main.ts` bootstrap

```typescript
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: 'http://localhost:3000', credentials: true });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

---

## Frontend — Next.js

### Setup commands

```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false
npm install axios react-hook-form zod @hookform/resolvers
npm install zustand @tanstack/react-query
npm install react-player
npm install shadcn-ui   # or: npx shadcn@latest init
```

### Folder structure

```
frontend/
├── app/
│   ├── layout.tsx             # Root layout with QueryProvider
│   ├── middleware.ts           # Route protection by role
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (student)/
│   │   ├── layout.tsx         # Checks role === student
│   │   ├── dashboard/page.tsx
│   │   ├── courses/page.tsx
│   │   └── courses/[id]/
│   │       ├── page.tsx       # Course viewer
│   │       └── quiz/[quizId]/page.tsx
│   ├── (teacher)/
│   │   ├── layout.tsx         # Checks role === teacher
│   │   ├── dashboard/page.tsx
│   │   ├── courses/create/page.tsx
│   │   └── courses/[id]/edit/page.tsx
│   └── (admin)/
│       ├── layout.tsx         # Checks role === admin
│       └── dashboard/page.tsx
├── components/
│   ├── ui/                    # shadcn components
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── course/
│   │   ├── CourseCard.tsx
│   │   ├── LessonList.tsx
│   │   └── VideoPlayer.tsx
│   ├── quiz/
│   │   ├── QuizPlayer.tsx
│   │   └── ScoreDisplay.tsx
│   └── progress/
│       └── ProgressBar.tsx
├── lib/
│   ├── api.ts                 # Axios instance
│   ├── auth.ts                # Token helpers
│   └── types.ts               # Shared TypeScript types
├── store/
│   └── auth.store.ts          # Zustand auth store
└── middleware.ts
```

### API client (`lib/api.ts`)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
```

### Auth store (`store/auth.store.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'admin';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
    }),
    { name: 'auth-storage' },
  ),
);
```

### Route protection (`middleware.ts`)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const roleRoutes: Record<string, string[]> = {
  '/student': ['student'],
  '/teacher': ['teacher'],
  '/admin':   ['admin'],
};

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  if (!token && pathname !== '/login' && pathname !== '/register') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Decode role from JWT payload (base64 middle segment)
  if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    for (const [route, roles] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(route) && !roles.includes(payload.role)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/teacher/:path*', '/admin/:path*'],
};
```

### TypeScript types (`lib/types.ts`)

```typescript
export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  thumbnailUrl?: string;
  teacher: Pick<User, 'id' | 'firstName' | 'lastName'>;
  createdAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  content?: string;
  type: 'video' | 'pdf' | 'text';
  fileUrl?: string;
  order: number;
  courseId: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  timeLimitMinutes: number;
  courseId: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  points: number;
  // correctAnswer is NOT sent to the frontend
}

export interface QuizAttempt {
  id: string;
  score: number;
  submittedAt: string;
  answers: Record<string, string>;
}

export interface Progress {
  lessonId: string;
  isCompleted: boolean;
}
```

---

## Database schema (SQL)

```sql
CREATE DATABASE IF NOT EXISTS elearning;
USE elearning;

-- TypeORM will auto-create tables via synchronize: true in development.
-- For production, use TypeORM migrations instead.
-- Set synchronize: false and run: npm run typeorm migration:run
```

In `database.config.ts` for development:

```typescript
synchronize: true,   // auto-creates/alters tables from entities
logging: true,       // logs all SQL queries
```

---

## Development roadmap

### Phase 1 — Auth foundation
**Goal:** Working login/register with JWT and roles.

- [ ] Create NestJS project, install dependencies
- [ ] Connect MySQL via TypeORM (`.env` configured)
- [ ] Build `User` entity and `UsersService`
- [ ] Build `AuthService` (register + login with bcrypt)
- [ ] Build `AuthController` with `/auth/register`, `/auth/login`, `/auth/me`
- [ ] Build `JwtStrategy`, `JwtAuthGuard`, `RolesGuard`
- [ ] Test all auth endpoints with Postman or Thunder Client
- [ ] Build Next.js login and register pages
- [ ] Implement `useAuthStore` with Zustand
- [ ] Implement `middleware.ts` route protection

### Phase 2 — Course management
**Goal:** Teachers create courses, students browse and enroll.

- [ ] Build `Course` entity and `CoursesModule`
- [ ] CRUD endpoints: POST, GET, PATCH, DELETE `/courses`
- [ ] Build `Enrollment` entity and `EnrollmentsModule`
- [ ] POST `/courses/:id/enroll` (student only)
- [ ] Build Next.js course catalog page (student)
- [ ] Build course creation form (teacher)
- [ ] Build teacher dashboard with "My Courses" list

### Phase 3 — Lessons and file uploads
**Goal:** Teachers upload PDFs/videos, students view them.

- [ ] Build `Lesson` entity and `LessonsModule`
- [ ] POST `/courses/:id/lessons` (teacher)
- [ ] Configure Multer for file uploads (PDF + video)
- [ ] POST `/files/upload` endpoint
- [ ] Serve uploaded files as static assets
- [ ] Build lesson viewer page (Next.js)
- [ ] Integrate `react-player` for video lessons
- [ ] Embed PDF viewer with `<iframe>` or `react-pdf`

### Phase 4 — Quizzes and grading
**Goal:** Teachers create quizzes, students take them, scores are stored.

- [ ] Build `Quiz`, `Question`, `QuizAttempt` entities
- [ ] POST `/quizzes` (teacher creates quiz + questions)
- [ ] GET `/quizzes/:id` (returns questions without `correctAnswer`)
- [ ] POST `/quizzes/:id/attempt` (student submits, server grades)
- [ ] Auto-grading logic: compare submitted answers to `correctAnswer`, calculate score percentage
- [ ] GET `/quizzes/:id/results` (teacher sees all attempts)
- [ ] Build `QuizPlayer` component (one question at a time)
- [ ] Build score display after submission

### Phase 5 — Progress tracking
**Goal:** Students see their completion progress per course.

- [ ] Build `Progress` entity
- [ ] PATCH `/progress/:lessonId/complete` (student marks done)
- [ ] GET `/progress/me` (returns all completed lessons)
- [ ] Build `ProgressBar` component (completed/total lessons)
- [ ] Show progress on student dashboard per enrolled course

### Phase 6 — Admin and polish
**Goal:** Admin manages users, UI is complete.

- [ ] GET `/users` (admin only — list all users)
- [ ] PATCH `/users/:id/role` (admin changes roles)
- [ ] Build admin dashboard with user table
- [ ] Add error handling (global exception filter in NestJS)
- [ ] Add loading states, empty states, and error messages in Next.js
- [ ] Consistent Tailwind styling across all pages
- [ ] Responsive design (mobile-friendly)

---

## UI pages checklist

| Page | Route | Role | Status |
|------|-------|------|--------|
| Login | `/login` | All | — |
| Register | `/register` | All | — |
| Student dashboard | `/student/dashboard` | Student | — |
| Course catalog | `/student/courses` | Student | — |
| Course viewer | `/student/courses/[id]` | Student | — |
| Quiz page | `/student/courses/[id]/quiz/[quizId]` | Student | — |
| Teacher dashboard | `/teacher/dashboard` | Teacher | — |
| Create course | `/teacher/courses/create` | Teacher | — |
| Edit course | `/teacher/courses/[id]/edit` | Teacher | — |
| Admin dashboard | `/admin/dashboard` | Admin | — |

---

## Recommended libraries summary

### Backend

| Library | Purpose |
|---------|---------|
| `@nestjs/jwt` | JWT signing and verification |
| `passport-jwt` | JWT extraction from headers |
| `typeorm` | ORM for MySQL |
| `mysql2` | MySQL driver |
| `bcrypt` | Password hashing |
| `class-validator` | DTO validation |
| `class-transformer` | Transform request bodies |
| `multer` | File upload middleware |
| `@nestjs/config` | `.env` management |

### Frontend

| Library | Purpose |
|---------|---------|
| `axios` | HTTP client |
| `zustand` | Auth state management |
| `@tanstack/react-query` | Server state, caching |
| `react-hook-form` | Form management |
| `zod` | Schema validation |
| `react-player` | Video playback |
| `shadcn/ui` | UI component library |
| `tailwindcss` | Utility-first CSS |

---

## Best practices (Claude Code must follow these)

1. **Never hardcode secrets** — always use `process.env` and `.env` files
2. **Always use DTOs** with `class-validator` decorators on every controller input
3. **Never put business logic in controllers** — controllers call services, services handle logic
4. **Never send `password` or `correctAnswer` in API responses** — use response DTOs or exclude columns
5. **Always hash passwords** with bcrypt before saving to the database
6. **Guard every protected route** with `JwtAuthGuard` first, then `RolesGuard` second
7. **Use TypeORM relations** — don't write raw JOIN queries in the MVP
8. **One module per feature** — never mix course logic into the auth module
9. **Use `ValidationPipe` globally** in `main.ts` with `whitelist: true`
10. **File uploads go to `/uploads` directory** — never serve them from `src/`

---

## School presentation structure

```
1. Problem statement    (1 min)  — why distance learning needs a platform
2. Live demo           (5 min)  — register → enroll → view lesson → take quiz → see grade
3. Architecture        (3 min)  — show this README's architecture diagram, explain JWT + roles
4. Code walkthrough    (2 min)  — one NestJS module + one Next.js page
5. Q&A                 (open)
```

Demo flow:
1. Register as a **teacher**, create a course, upload a PDF lesson, create a quiz
2. Register as a **student**, browse courses, enroll, view the lesson, take the quiz
3. Switch back to teacher, view quiz results and student scores
4. Login as **admin**, show user list and role management

---

## Claude Code instructions

> When using this README in Claude Code, use the following approach:
>
> 1. **Start with Phase 1** — do not jump to file uploads before auth works
> 2. **Generate one module at a time** — entity → service → controller → module registration
> 3. **Test each endpoint before moving on** — use Thunder Client or curl
> 4. **Ask Claude Code to:** "Implement the Auth module based on the README spec" then "Add the Course module" etc.
> 5. Use the entity definitions above **exactly** — do not rename columns or change types
> 6. When stuck, paste the relevant README section and ask for help with that specific piece
