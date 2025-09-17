import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../components/Header';

describe('Header Component', () => {
    test('renders navigation links', () => {
        render(
            <BrowserRouter>
                <Header />
            </BrowserRouter>
        );

        expect(screen.getByText('🎬 ReelScript AI')).toBeInTheDocument();
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Contribute')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    test('has correct navigation links', () => {
        render(
            <BrowserRouter>
                <Header />
            </BrowserRouter>
        );

        const homeLink = screen.getByText('Home');
        const contributeLink = screen.getByText('Contribute');
        const adminLink = screen.getByText('Admin');

        expect(homeLink).toHaveAttribute('href', '/');
        expect(contributeLink).toHaveAttribute('href', '/contribute');
        expect(adminLink).toHaveAttribute('href', '/admin');
    });
});