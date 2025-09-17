import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Contribute from '../pages/Contribute';

// Mock Firebase
jest.mock('../firebase', () => ({
    db: {},
    auth: {}
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    addDoc: jest.fn(),
    serverTimestamp: jest.fn()
}));

describe('Contribute Component', () => {
    test('renders contribution form', () => {
        render(
            <BrowserRouter>
                <Contribute />
            </BrowserRouter>
        );

        expect(screen.getByText('Add New Item')).toBeInTheDocument();
        expect(screen.getByLabelText('Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Content')).toBeInTheDocument();
        expect(screen.getByLabelText('Situation/Context')).toBeInTheDocument();
        expect(screen.getByLabelText('Tags (comma-separated)')).toBeInTheDocument();
    });

    test('has correct form fields', () => {
        render(
            <BrowserRouter>
                <Contribute />
            </BrowserRouter>
        );

        const typeSelect = screen.getByLabelText('Type');
        expect(typeSelect).toHaveValue('dialogue');
        expect(screen.getByText('Dialogue')).toBeInTheDocument();
        expect(screen.getByText('Meme')).toBeInTheDocument();
        expect(screen.getByText('Trend')).toBeInTheDocument();
    });
});