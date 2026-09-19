'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
import {
  PropertyValueFields,
  toOptionalAmount,
} from '@/components/landlord/properties/PropertyValueFields';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';

interface PropertyValueModalProps {
  property: {
    propertyId: string;
    name: string;
    estimatedValue?: number;
    purchasePrice?: number;
  } | null;
  onClose: () => void;
}

/** The quick way to say what a property is worth, from the Portfolio table. */
export const PropertyValueModal = ({ property, onClose }: PropertyValueModalProps) => (
  <Dialog open={!!property} onOpenChange={(open) => !open && onClose()}>
    <DialogContent>
      {property && (
        <PropertyValueForm key={property.propertyId} property={property} onClose={onClose} />
      )}
    </DialogContent>
  </Dialog>
);

const PropertyValueForm = ({
  property,
  onClose,
}: {
  property: NonNullable<PropertyValueModalProps['property']>;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const [estimatedValue, setEstimatedValue] = useState(
    property.estimatedValue ? String(property.estimatedValue) : ''
  );
  const [purchasePrice, setPurchasePrice] = useState(
    property.purchasePrice ? String(property.purchasePrice) : ''
  );

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        landlordService.updateProperty(property.propertyId, {
          estimatedValue: toOptionalAmount(estimatedValue),
          purchasePrice: toOptionalAmount(purchasePrice),
        })
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: landlordKeys.portfolioAnalytics }),
        queryClient.invalidateQueries({ queryKey: landlordKeys.properties }),
      ]);
      onClose();
    },
  });

  return (
    <>
      <div className="p-4 border-b border-border">
        <DialogTitle className="font-semibold text-foreground">{property.name}</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          Add what it is worth and what it cost to see its cap rate and yield.
        </DialogDescription>
      </div>
      <div className="p-4 space-y-4">
        <PropertyValueFields
          estimatedValue={estimatedValue}
          purchasePrice={purchasePrice}
          onEstimatedValueChange={setEstimatedValue}
          onPurchasePriceChange={setPurchasePrice}
        />
        {save.isError && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {save.error instanceof Error
              ? save.error.message
              : 'We could not save those figures. Please try again.'}
          </p>
        )}
        <Button
          variant="primary"
          fullWidth
          onClick={() => save.mutate()}
          isLoading={save.isPending}
          disabled={
            save.isPending ||
            (!toOptionalAmount(estimatedValue) && !toOptionalAmount(purchasePrice))
          }
        >
          Save
        </Button>
      </div>
    </>
  );
};
