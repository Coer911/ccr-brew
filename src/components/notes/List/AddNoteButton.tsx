'use client';

import React from 'react';
import { AddNoteButtonProps } from '../types';
import BottomActionBar from '@/components/layout/BottomActionBar';

const AddNoteButton: React.FC<AddNoteButtonProps> = ({ onAddNote }) => {
  return (
    <BottomActionBar
      buttons={[
        {
          icon: '+',
          text: 'Добавить вручную',
          onClick: () => onAddNote(),
        },
      ]}
    />
  );
};

export default AddNoteButton;
