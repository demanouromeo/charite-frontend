import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardResume } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  resume(): Observable<{ data: DashboardResume }> {
    return this.http.get<{ data: DashboardResume }>(`${this.apiUrl}/statistiques/resume`);
  }
}
