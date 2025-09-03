import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const SeismicResultsTable = ({ seismicResult }) => {
  if (!seismicResult) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Seismic Analysis Results</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Site Information */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p className="text-sm">{seismicResult.address_checked}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Site Class</p>
            <Badge variant="outline">{seismicResult.site_class}</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Longitude</p>
            <p className="text-sm">{seismicResult.coordinates?.lon}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Latitude</p>
            <p className="text-sm">{seismicResult.coordinates?.lat}</p>
          </div>
        </div>

        {/* Seismic Hazard Table */}
        <div className="space-y-4">
          <h3 className="text-md font-semibold">Spectral Acceleration Values</h3>
          <Table className="w-full [&_table]:table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center font-medium w-1/3">Period T (s)</TableHead>
                <TableHead className="text-center font-medium w-1/3">Sa(T,X)</TableHead>
                <TableHead className="text-center font-medium w-1/3">Sa(T,X450)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {['0.2', '0.5', '1.0', '2.0', '5.0', '10.0', 'PGA'].map((T, i) => (
                <TableRow key={T}>
                  <TableCell className="text-center font-medium">{T}</TableCell>
                  <TableCell className="text-center">
                    {seismicResult.sa_site ? seismicResult.sa_site[i] : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {seismicResult.sa_x450 ? seismicResult.sa_x450[i] : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeismicResultsTable; 