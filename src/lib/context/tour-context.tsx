'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Shepherd from 'shepherd.js';
import { usePathname } from 'next/navigation';
import { useApp } from './app-context';
import { getProjects } from '@/lib/server/project.actions';

interface TourContextType {
  startTour: () => void;
  isActive: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const pathname = usePathname();
  const { userProfile } = useApp();

  const startTour = () => {
    if (typeof window === 'undefined') return;

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shadow-premium',
        scrollTo: true,
        cancelIcon: {
           enabled: true
        }
      }
    });

    tour.addStep({
      id: 'sidebar-nav',
      title: 'Navigation Principale',
      text: 'Accédez rapidement à tous vos modules : Budget, Stocks, Ouvriers et Planning.',
      attachTo: {
        element: 'aside',
        on: 'right'
      },
      buttons: [
        {
          text: 'Suivant',
          action: tour.next,
          classes: 'shepherd-button'
        }
      ]
    });

    tour.addStep({
      id: 'project-selector',
      title: 'Sélecteur de Chantier',
      text: 'C\'est ici que vous changez de contexte. Toutes les données affichées s\'adaptent au chantier sélectionné.',
      attachTo: {
        element: '[data-tour=\"project-selector\"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Précédent',
          action: tour.back,
          classes: 'shepherd-button shepherd-button-secondary'
        },
        {
          text: 'Suivant',
          action: tour.next,
          classes: 'shepherd-button'
        }
      ]
    });

    tour.addStep({
      id: 'dashboard-stats',
      title: 'Indicateurs Clés',
      text: 'Gardez un oeil sur vos alertes de stock et vos marges en temps réel.',
      attachTo: {
        element: '.grid-cols-2',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Terminer',
          action: tour.complete,
          classes: 'shepherd-button'
        }
      ]
    });

    tour.on('complete', () => {
      setIsActive(false);
      localStorage.setItem('gestibulder_tour_completed', 'true');
    });

    tour.on('cancel', () => {
      setIsActive(false);
    });

    setIsActive(true);
    tour.start();
  };

  useEffect(() => {
    const checkAndStartTour = async () => {
      const hasCompletedTour = localStorage.getItem('gestibulder_tour_completed');
      if (hasCompletedTour || pathname !== '/dashboard' || !userProfile) return;

      const res = await getProjects();
      if (res.projects && res.projects.length > 0) {
        const timer = setTimeout(() => {
          startTour();
        }, 1500);
        return () => clearTimeout(timer);
      }
    };

    checkAndStartTour();
  }, [pathname, userProfile]);

  return (
    <TourContext.Provider value={{ startTour, isActive }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
