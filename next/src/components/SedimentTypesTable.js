import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const SedimentTypesTable = ({ sedimentTypes, seismicResult }) => {
  if (!sedimentTypes || sedimentTypes.length === 0) return null;

  const showProbability = seismicResult && seismicResult.rgb;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Soil Classification & Properties</CardTitle>
      </CardHeader>
      <CardContent>
        <Table className="w-full [&_table]:table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center font-medium w-[8%]">Type</TableHead>
              <TableHead className="text-center font-medium w-1/4">Sediments</TableHead>
              <TableHead className="text-center font-medium w-[12%]">Site Class</TableHead>
              <TableHead className="text-center font-medium w-[15%]">Soil Pressure (psf)</TableHead>
              <TableHead className="text-center font-medium w-[10%]">Color</TableHead>
              <TableHead className="text-center font-medium w-[8%]">R</TableHead>
              <TableHead className="text-center font-medium w-[8%]">G</TableHead>
              <TableHead className="text-center font-medium w-[8%]">B</TableHead>
              {showProbability && (
                <TableHead className="text-center font-medium w-[16%]">Probability</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sedimentTypes.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-center font-medium">{row.id}</TableCell>
                <TableCell className="text-center">{row.sediment_name}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{row.site_class}</Badge>
                </TableCell>
                <TableCell className="text-center">{row.soil_pressure_psf}</TableCell>
                <TableCell className="text-center">
                  <div
                    className="inline-block w-8 h-5 rounded border border-border"
                    style={{
                      backgroundColor: `rgb(${row.color_r}, ${row.color_g}, ${row.color_b})`
                    }}
                  />
                </TableCell>
                <TableCell className="text-center">{row.color_r}</TableCell>
                <TableCell className="text-center">{row.color_g}</TableCell>
                <TableCell className="text-center">{row.color_b}</TableCell>
                {showProbability && (
                  <TableCell className="text-center">
                    {row.probability !== undefined ? `${(row.probability * 100).toFixed(3)}%` : '-'}
                  </TableCell>
                )}
              </TableRow>
            ))}
            
            {/* Result Row */}
            {showProbability && seismicResult && seismicResult.most_similar_soil && (
              <TableRow className="bg-accent/50 border-l-4 border-l-primary">
                <TableCell className="text-center font-bold">
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    Result
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-bold">
                  {seismicResult.most_similar_soil.sediment_name}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    {seismicResult.most_similar_soil.site_class}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-bold">
                  {seismicResult.most_similar_soil.soil_pressure_psf}
                </TableCell>
                <TableCell className="text-center">
                  <div
                    className="inline-block w-8 h-5 rounded border-2 border-primary"
                    style={{
                      backgroundColor: `rgb(${seismicResult.most_similar_soil.color_r}, ${seismicResult.most_similar_soil.color_g}, ${seismicResult.most_similar_soil.color_b})`
                    }}
                  />
                </TableCell>
                <TableCell className="text-center font-bold">
                  {seismicResult.most_similar_soil.color_r}
                </TableCell>
                <TableCell className="text-center font-bold">
                  {seismicResult.most_similar_soil.color_g}
                </TableCell>
                <TableCell className="text-center font-bold">
                  {seismicResult.most_similar_soil.color_b}
                </TableCell>
                <TableCell className="text-center font-bold">
                  {(() => {
                    if (!sedimentTypes.length) return '-';
                    const rgb = seismicResult.rgb;
                    const soil_rgb = [
                      seismicResult.most_similar_soil.color_r,
                      seismicResult.most_similar_soil.color_g,
                      seismicResult.most_similar_soil.color_b
                    ];
                    const dot = rgb[0] * soil_rgb[0] + rgb[1] * soil_rgb[1] + rgb[2] * soil_rgb[2];
                    const norm1 = Math.sqrt(rgb[0] ** 2 + rgb[1] ** 2 + rgb[2] ** 2);
                    const norm2 = Math.sqrt(soil_rgb[0] ** 2 + soil_rgb[1] ** 2 + soil_rgb[2] ** 2);
                    return norm1 && norm2 ? `${(dot / (norm1 * norm2) * 100).toFixed(3)}%` : '-';
                  })()}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SedimentTypesTable; 