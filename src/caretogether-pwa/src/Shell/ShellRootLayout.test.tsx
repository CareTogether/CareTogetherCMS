import React from 'react';
import { render, screen } from '@testing-library/react';
import ShellRootLayout from './ShellRootLayout';

test('renders learn react link', () => {
  render(<ShellRootLayout />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
