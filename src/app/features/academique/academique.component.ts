import { Component, ViewChild } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { ClassesTabComponent } from './classes-tab/classes-tab.component';
import { MatieresTabComponent } from './matieres-tab/matieres-tab.component';
import { AnneesTabComponent } from './annees-tab/annees-tab.component';
import { ClasseAnneeTabComponent } from './classes-annee-tab/classes-annee-tab.component';
import { BaremeTabComponent } from './bareme-tab/bareme-tab.component';
import { SequencesTabComponent } from './sequences-tab/sequences-tab.component';

@Component({
  selector: 'app-academique',
  standalone: true,
  imports: [
    MatTabsModule,
    ClassesTabComponent,
    MatieresTabComponent,
    AnneesTabComponent,
    ClasseAnneeTabComponent,
    BaremeTabComponent,
    SequencesTabComponent,
  ],
  template: `
    <div class="page">
      <h1>Classes &amp; académique</h1>
      <mat-tab-group (selectedIndexChange)="onTabChange($event)">
        <mat-tab label="Classes de l'année">
          <app-classes-annee-tab />
        </mat-tab>
        <mat-tab label="Frais de scolarité">
          <app-bareme-tab />
        </mat-tab>
        <mat-tab label="Séquences">
          <app-sequences-tab />
        </mat-tab>
        <mat-tab label="Types de classe">
          <app-classes-tab />
        </mat-tab>
        <mat-tab label="Matières">
          <app-matieres-tab />
        </mat-tab>
        <mat-tab label="Années scolaires">
          <app-annees-tab />
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 8px 4px;
      }
      h1 {
        font-size: 1.4rem;
        margin: 0 0 8px;
      }
    `,
  ],
})
export class AcademiqueComponent {
  @ViewChild(ClasseAnneeTabComponent) private classesAnneeTab?: ClasseAnneeTabComponent;
  @ViewChild(BaremeTabComponent) private baremeTab?: BaremeTabComponent;
  @ViewChild(SequencesTabComponent) private sequencesTab?: SequencesTabComponent;

  onTabChange(index: number): void {
    // Revenir sur un onglet dépendant des années scolaires doit refléter les années
    // créées/activées entretemps depuis un autre onglet.
    if (index === 0) {
      this.classesAnneeTab?.rafraichirAnnees();
    } else if (index === 1) {
      this.baremeTab?.rafraichirAnnees();
    } else if (index === 2) {
      this.sequencesTab?.rafraichirAnnees();
    }
  }
}
