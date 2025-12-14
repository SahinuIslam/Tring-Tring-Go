import { render, screen } from '@testing-library/react';
import CommunityFeed from '../CommunityFeed';

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('CommunityFeed FilterBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
      role: 'TRAVELER', 
      mode: 'TRAVELER', 
      token: 'fake-token'
    }));
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    );
  });

  test('renders FilterBar with category buttons', () => {
    render(<CommunityFeed />);
    expect(screen.getByText('All Posts')).toBeInTheDocument();
    expect(screen.getByText('Price Alerts')).toBeInTheDocument();
  });

  test('FilterBar active class on All Posts', () => {
    render(<CommunityFeed />);
    const allPostsBtn = screen.getByText('All Posts');
    expect(allPostsBtn).toHaveClass('filter-chip active');
  });
});
