import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  customTemplate?: TemplateRef<any>;
}

export interface TableAction {
  label: string;
  icon?: string;
  class?: string;
  handler: (row: any) => void;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss'
})
export class TableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() title: string = 'قائمة البيانات';
  @Input() searchPlaceholder: string = 'بحث...';
  @Input() showSearch: boolean = true;
  @Input() showFilter: boolean = true;
  @Input() showCheckboxes: boolean = true;
  @Input() showStatusColumn: boolean = true;
  @Input() itemsPerPage: number = 10;
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;
  
  @Output() rowClick = new EventEmitter<any>();
  @Output() actionClick = new EventEmitter<{ action: TableAction, row: any }>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() sortChange = new EventEmitter<{ column: string, direction: 'asc' | 'desc' }>();

  searchTerm: string = '';
  selectedRows: Set<any> = new Set();
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  get allSelected(): boolean {
    return this.data.length > 0 && this.selectedRows.size === this.data.length;
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.data.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil((this.totalItems || this.data.length) / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    const half = Math.floor(maxPages / 2);
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, start + maxPages - 1);
    
    if (end - start + 1 < maxPages) {
      start = Math.max(1, end - maxPages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  Math = Math;

  get displayStart(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get displayEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems || this.data.length);
  }

  get displayTotal(): number {
    return this.totalItems || this.data.length;
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchChange.emit(value);
  }

  onRowClick(row: any, event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.checkbox-cell') && !target.closest('.actions-cell')) {
      this.rowClick.emit(row);
    }
  }

  onActionClick(action: TableAction, row: any, event: Event): void {
    event.stopPropagation();
    this.actionClick.emit({ action, row });
    action.handler(row);
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.selectedRows.clear();
    } else {
      this.data.forEach(row => this.selectedRows.add(row));
    }
    this.emitSelection();
  }

  toggleRowSelection(row: any, event: Event): void {
    event.stopPropagation();
    if (this.selectedRows.has(row)) {
      this.selectedRows.delete(row);
    } else {
      this.selectedRows.add(row);
    }
    this.emitSelection();
  }

  isRowSelected(row: any): boolean {
    return this.selectedRows.has(row);
  }

  emitSelection(): void {
    this.selectionChange.emit(Array.from(this.selectedRows));
  }

  onSort(column: TableColumn): void {
    if (!column.sortable) return;
    
    if (this.sortColumn === column.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }
    
    this.sortChange.emit({ column: column.key, direction: this.sortDirection });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChange.emit(page);
    }
  }

  getCellValue(row: any, column: TableColumn): any {
    return row[column.key];
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'قيد المراجعة': 'bg-warning',
      'مقبول': 'bg-success',
      'مرفوض': 'bg-danger',
      'نشطة': 'bg-success',
      'مكتملة': 'bg-secondary',
      'قريباً': 'bg-info'
    };
    return statusClasses[status] || 'bg-secondary';
  }
}