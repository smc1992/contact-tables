import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '../Header';

// Mock useRouter
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    push: jest.fn(),
  }),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signOut: jest.fn(),
  }),
}));

describe('Header Component', () => {
  it('renders the header with logo', () => {
    render(<Header />);
    
    // Prüfen, ob das Logo vorhanden ist
    const logoElement = screen.getByAltText(/logo/i);
    expect(logoElement).toBeInTheDocument();
  });
});
