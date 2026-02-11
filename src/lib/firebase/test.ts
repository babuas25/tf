/**
 * Firebase Test Utility
 * Tests Firebase configuration and basic operations to identify issues
 */

import { signInAnonymously, signOut } from 'firebase/auth'
import { doc, deleteDoc } from 'firebase/firestore'

import { auth, db } from './config'
import { firestoreWithRetry, handleFirebaseError } from './connection'

export interface TestResult {
  testName: string
  success: boolean
  error?: string
  duration?: number
  details?: unknown
}

export class FirebaseTester {
  private results: TestResult[] = []

  private async runTest<T>(testName: string, testFunction: () => Promise<T>): Promise<TestResult> {
    const startTime = Date.now()

    try {
      console.log(`🧪 Running test: ${testName}`)
      const result = await testFunction()
      const duration = Date.now() - startTime

      const testResult: TestResult = {
        testName,
        success: true,
        duration,
        details: result,
      }

      this.results.push(testResult)
      console.log(`✅ ${testName} passed (${duration}ms)`)
      return testResult
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = handleFirebaseError(error)

      const testResult: TestResult = {
        testName,
        success: false,
        error: errorMessage,
        duration,
        details: error,
      }

      this.results.push(testResult)
      console.error(`❌ ${testName} failed (${duration}ms):`, errorMessage)
      return testResult
    }
  }

  async testConfiguration(): Promise<TestResult> {
    return await this.runTest('Configuration Check', async () => {
      // Check if Firebase is initialized
      if (!auth || !db) {
        throw new Error('Firebase services not initialized')
      }

      // Check if required config values exist
      const requiredEnvVars = [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
        'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
        'NEXT_PUBLIC_FIREBASE_APP_ID',
      ]

      const missing = requiredEnvVars.filter((envVar) => !process.env[envVar])

      if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`)
      }

      return {
        authInitialized: !!auth,
        firestoreInitialized: !!db,
        projectId: auth.config?.apiHost || 'unknown',
      }
    })
  }

  async testAuthConnection(): Promise<TestResult> {
    return await this.runTest('Auth Connection', async () => {
      // Test auth connection by checking current user
      const user = auth.currentUser

      return {
        hasCurrentUser: !!user,
        userId: user?.uid || null,
        authReady: auth.config ? true : false,
      }
    })
  }

  async testFirestoreConnection(): Promise<TestResult> {
    return await this.runTest('Firestore Connection', async () => {
      // Test Firestore by trying to access app info
      if (!db.app) {
        throw new Error('Firestore app not accessible')
      }

      return {
        appInitialized: !!db.app,
        projectId: db.app.options.projectId,
      }
    })
  }

  async testAnonymousAuth(): Promise<TestResult> {
    return this.runTest('Anonymous Authentication', async () => {
      // Sign in anonymously to test auth functionality
      const userCredential = await signInAnonymously(auth)
      const user = userCredential.user

      // Sign out immediately after test
      await signOut(auth)

      return {
        userId: user.uid,
        isAnonymous: user.isAnonymous,
        signInSuccessful: true,
        signOutSuccessful: true,
      }
    })
  }

  async testFirestoreOperations(): Promise<TestResult> {
    return this.runTest('Firestore Operations', async () => {
      const testDocId = `test-${Date.now()}`
      const testDocRef = doc(db, 'test-collection', testDocId)
      const testData = {
        message: 'Firebase test document',
        timestamp: new Date(),
        testId: testDocId,
      }

      // Test write
      await firestoreWithRetry.setDocument(testDocRef, testData)

      // Test read
      const readData = await firestoreWithRetry.getDocument(testDocRef)

      if (!readData) {
        throw new Error('Failed to read test document')
      }

      // Test delete (cleanup)
      await deleteDoc(testDocRef)

      return {
        writeSuccessful: true,
        readSuccessful: true,
        deleteSuccessful: true,
        testData: readData,
      }
    })
  }

  async testNetworkConnectivity(): Promise<TestResult> {
    return this.runTest('Network Connectivity', async () => {
      // Test basic network connectivity
      if (typeof window === 'undefined') {
        return { environment: 'server', online: true }
      }

      const isOnline = navigator.onLine

      // Test actual connectivity by making a request to Google's public DNS
      try {
        const response = await fetch('https://dns.google/resolve?name=example.com&type=A', {
          method: 'GET',
          mode: 'cors',
        })

        const connectivityTest = response.ok

        return {
          navigatorOnline: isOnline,
          actualConnectivity: connectivityTest,
          responseStatus: response.status,
        }
      } catch (error) {
        return {
          navigatorOnline: isOnline,
          actualConnectivity: false,
          error: (error as Error).message,
        }
      }
    })
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Firebase Test Suite...')
    this.results = []

    // Run tests in sequence
    await this.testConfiguration()
    await this.testNetworkConnectivity()
    await this.testAuthConnection()
    await this.testFirestoreConnection()

    // Only run these tests if basic connectivity works
    const basicTestsPassed = this.results.every((r) => r.success)

    if (basicTestsPassed) {
      await this.testAnonymousAuth()
      await this.testFirestoreOperations()
    } else {
      console.warn('⚠️ Skipping advanced tests due to basic connectivity issues')
    }

    // Print summary
    this.printSummary()

    return this.results
  }

  private printSummary(): void {
    console.log('\n🧪 Firebase Test Results Summary:')
    console.log('================================')

    const passed = this.results.filter((r) => r.success).length
    const failed = this.results.filter((r) => !r.success).length
    const total = this.results.length

    console.log(`Total Tests: ${total}`)
    console.log(`Passed: ${passed} ✅`)
    console.log(`Failed: ${failed} ❌`)
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.results
        .filter((r) => !r.success)
        .forEach((r) => console.log(`  • ${r.testName}: ${r.error}`))
    }

    console.log('\n📊 Test Details:')
    this.results.forEach((r) => {
      const status = r.success ? '✅' : '❌'
      const duration = r.duration ? `(${r.duration}ms)` : ''
      console.log(`  ${status} ${r.testName} ${duration}`)

      if (r.error) {
        console.log(`    Error: ${r.error}`)
      }
    })

    // Recommendations
    console.log('\n💡 Recommendations:')
    if (this.results.find((r) => r.testName === 'Configuration Check' && !r.success)) {
      console.log('  • Check your Firebase configuration and environment variables')
    }
    if (this.results.find((r) => r.testName === 'Network Connectivity' && !r.success)) {
      console.log('  • Check your internet connection')
    }
    if (this.results.find((r) => r.testName === 'Auth Connection' && !r.success)) {
      console.log('  • Verify Firebase Authentication is enabled in your Firebase project')
    }
    if (this.results.find((r) => r.testName === 'Firestore Connection' && !r.success)) {
      console.log('  • Verify Firestore is enabled in your Firebase project')
      console.log('  • Check Firestore security rules')
    }
  }

  getResults(): TestResult[] {
    return [...this.results]
  }

  getFailedTests(): TestResult[] {
    return this.results.filter((r) => !r.success)
  }

  getPassedTests(): TestResult[] {
    return this.results.filter((r) => r.success)
  }
}

// Convenience functions
export const firebaseTester = new FirebaseTester()

export async function runFirebaseTests(): Promise<TestResult[]> {
  return await firebaseTester.runAllTests()
}

export async function quickFirebaseTest(): Promise<boolean> {
  const results = await firebaseTester.runAllTests()
  return results.every((r) => r.success)
}

// Auto-run tests in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Add a global function to run tests from console
  ;(window as { runFirebaseTests?: typeof runFirebaseTests }).runFirebaseTests = runFirebaseTests
  ;(window as { quickFirebaseTest?: typeof quickFirebaseTest }).quickFirebaseTest =
    quickFirebaseTest

  console.log('🧪 Firebase tests available:')
  console.log('  • runFirebaseTests() - Run complete test suite')
  console.log('  • quickFirebaseTest() - Quick connectivity test')
}
