import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  templateUrl: './table-skeleton.component.html',
  styleUrl: './table-skeleton.component.scss',
})
export class TableSkeletonComponent {
  @Input() columns = 4;
  @Input() rows = 5;

  protected get rowsArray(): number[] {
    return Array.from({ length: this.rows });
  }

  protected get columnsArray(): number[] {
    return Array.from({ length: this.columns });
  }
}
