import { $ } from 'bun';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const repositories = [
  {
    name: 'ios',
    url: 'https://github.com/superwall/superwall-ios.git',
  },
  {
    name: 'android',
    url: 'https://github.com/superwall/superwall-android.git',
  },
  {
    name: 'flutter',
    url: 'https://github.com/superwall/Superwall-Flutter.git',
  },
  {
    name: 'expo',
    url: 'https://github.com/superwall/expo-superwall.git',
  },
  {
    name: 'react-native',
    url: 'https://github.com/superwall/react-native-superwall.git',
  },
];

const referenceDir = join(process.cwd(), 'reference');

// Create reference directory if it doesn't exist
if (!existsSync(referenceDir)) {
  mkdirSync(referenceDir, { recursive: true });
  console.log('Created reference directory');
}

// Clone or pull each repository
for (const repo of repositories) {
  const repoPath = join(referenceDir, repo.name);
  
  if (existsSync(repoPath)) {
    console.log(`Updating ${repo.name}...`);
    try {
      await $`cd ${repoPath} && git pull`;
      console.log(`✓ Updated ${repo.name}`);
    } catch (error) {
      console.error(`✗ Failed to update ${repo.name}:`, error);
    }
  } else {
    console.log(`Cloning ${repo.name}...`);
    try {
      await $`cd ${referenceDir} && git clone ${repo.url} ${repo.name}`;
      console.log(`✓ Cloned ${repo.name}`);
    } catch (error) {
      console.error(`✗ Failed to clone ${repo.name}:`, error);
    }
  }
}

console.log('\nAll repositories have been processed!');